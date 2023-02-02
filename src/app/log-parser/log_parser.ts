import format from 'date-fns/format';
import {app} from 'electron';
import {Stats, statSync} from 'fs';
import {join} from 'path';

import {getParsingMetadata} from 'root/api/getindicators';
import {setuserdata, UserData} from 'root/api/userbytokenid';
import {setCreds} from 'root/app/auth';
import {gameState} from 'root/app/game_state';
import {getJSONData} from 'root/app/log-parser/events';
import {FileParsingState, ParsingMetadata} from 'root/app/log-parser/model';
import {extractValue, parseAsJSONIfNeeded} from 'root/app/log-parser/parsing';
import {LogParserEventEmitter} from 'root/app/log_parser_events';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {StateInfo, stateStore} from 'root/app/state_store';
import {getAccountFromScreenName} from 'root/app/userswitch';
import {asyncForEach} from 'root/lib/asyncforeach';
import {error} from 'root/lib/logger';

import {ParseResults} from 'root/models/indicators';

const FIVE_SECONDS = 5000;

export class LogParser {
  private shouldStop: boolean = false;
  public isRunning: boolean = false;
  private currentState: StateInfo;
  private internalLoopTimeout: number = 0;
  private parsingMetadata: ParsingMetadata | undefined;
  private justStarted = true;

  public emitter = new LogParserEventEmitter();

  constructor() {
    this.currentState = stateStore.get();

    if (this.currentState && this.currentState.state.screenName !== undefined) {
      sendMessageToHomeWindow('set-screenname', {
        screenName: this.currentState.state.screenName,
        newPlayerId: '',
      });
    }
  }

  public async changeParserFreq(timeout: number | undefined): Promise<void> {
    if (timeout === undefined) {
      if (!this.parsingMetadata) {
        this.parsingMetadata = await getParsingMetadata();
      }
      this.internalLoopTimeout = this.parsingMetadata.logParser.readTimeout;
    } else {
      this.internalLoopTimeout = timeout;
    }
  }

  private getPath(fileToWatch: string): string {
    const specialpath = settingsStore.get().logPath;
    if (specialpath !== undefined) {
      return join(specialpath, fileToWatch);
    }
    return join(
      app.getPath('appData'),
      'LocalLow',
      'Second Dinner',
      'SNAP',
      'Standalone',
      'States',
      'nvprod',
      fileToWatch
    ).replace('Roaming\\', '');
  }

  public async start(): Promise<void> {
    try {
      if (this.isRunning) {
        // tslint:disable-next-line: no-console
        console.log('Trying to start the parser while still running');
        return;
      }
      this.isRunning = true;
      this.shouldStop = false;
      this.parsingMetadata = await getParsingMetadata();
      //console.log(this.parsingMetadata);
      this.internalLoopTimeout = FIVE_SECONDS;
      this.internalLoop(this.parsingMetadata);
    } catch (e) {
      error('start.getParsingMetadata', e);
      this.emitter.emit('error', String(e));
      this.isRunning = false;
    }
  }

  public stop(): void {
    this.shouldStop = true;
    this.isRunning = false;
  }

  private async internalLoop(parsingMetadata: ParsingMetadata): Promise<void> {
    if (this.shouldStop) {
      return;
    }
    //console.log('loop!');
    let parsedResults: {[index: string]: any} = {};
    let nextFilesState: {[index: string]: FileParsingState} = {};
    let latestUpdateDate: Date | undefined = undefined;
    const variables: {[index: string]: any} = {};

    try {
      await asyncForEach(parsingMetadata.FilesToParse, async (fileToParse) => {
        const path = this.getPath(fileToParse);
        //console.log(path);
        //const LogFromMTGAFolder = locateMostRecentDate();
        let stats: Stats | undefined = undefined;
        try {
          stats = statSync(path);
        } catch (e) {
          this.emitter.emit('nologfile', undefined);
          throw new Error(
            "Parsing paused: we can't locate your SNAP/Standalone/States/nvprod dir. Please locate it manually in settings! "
          );
        }
        //console.log(stats);
        //const hash = md5File.sync(path);
        if (
          stats &&
          !this.justStarted &&
          this.currentState?.state?.filesStates[fileToParse] &&
          stats.mtime <= this.currentState.state.filesStates[fileToParse].lastEdit
        ) {
          //console.log(`no changes in ${fileToParse}`);
          return;
        }

        if (!stats) {
          return;
        }

        latestUpdateDate = stats.mtime;
        // File doesn't exist
        if (!nextFilesState[fileToParse]) {
          nextFilesState[fileToParse] = {lastEdit: stats.mtime, md5: ''};
        } else {
          nextFilesState[fileToParse].lastEdit = stats.mtime;
          nextFilesState[fileToParse].md5 = '';
        }
        const data = await getJSONData(path);
        const dataParsed = parseAsJSONIfNeeded(data);

        //console.log(parsingMetadata.Variables);
        Object.keys(parsingMetadata.Variables).forEach((Variable) => {
          if (parsingMetadata.Variables[Variable][0] !== fileToParse) {
            return;
          }
          const pathToVariableToExtract = parsingMetadata.Variables[Variable].slice(1);
          const extractedElementToProcess = extractValue(dataParsed, pathToVariableToExtract) as Array<any>;
          //console.log('extractedElementToProcess', extractedElementToProcess);
          switch (Variable) {
            case 'PLAYER_ID':
              extractedElementToProcess.forEach((extractedElement, i) => {
                const extractedAccountId = extractValue(dataParsed, [...pathToVariableToExtract, i, 'AccountId']);
                if (extractedAccountId && extractedAccountId === this.currentState.state.userId) {
                  variables[Variable] = i;
                  variables['OPPONENT_ID'] = i == 0 ? 1 : 0;
                  variables['PLAYER_NUM'] = i == 0 ? 1 : 2;
                  variables['OPPONENT_NUM'] = i == 0 ? 2 : 1;
                }
              });
              break;
          }
          //variables[Variable] = extractedElementToProcess;
        });

        //console.log('variables', variables);

        Object.keys(parsingMetadata.ExtractFromFiles).forEach((DataObject) => {
          if (parsingMetadata.ExtractFromFiles[DataObject][0] !== fileToParse) {
            return;
          }
          const pathToInterestingThing = parsingMetadata.ExtractFromFiles[DataObject].slice(1);
          const interestingThing = extractValue(dataParsed, pathToInterestingThing, variables);
          parsedResults[DataObject] = interestingThing;
          //console.log(DataObject, interestingThing);
        });

        Object.keys(parsingMetadata.ResolveRefs).forEach((ResolvableElement) => {
          if (parsingMetadata.ResolveRefs[ResolvableElement][0] !== fileToParse) {
            return;
          }
          const pathToInterestingThing = parsingMetadata.ResolveRefs[ResolvableElement].slice(1);
          const interestingThing = extractValue(dataParsed, pathToInterestingThing, variables);
          Object.keys(interestingThing).forEach((interestingThingIndex) => {
            const resolvedInterestingThing = extractValue(
              dataParsed,
              [...pathToInterestingThing, interestingThingIndex],
              variables
            );
            interestingThing[interestingThingIndex] = resolvedInterestingThing;
          });
          parsedResults[ResolvableElement] = interestingThing;
          //console.log(ResolvableElement, interestingThing);
        });

        Object.keys(parsingMetadata.GatherFromArray).map((DataObjectArray) => {
          if (parsingMetadata.GatherFromArray[DataObjectArray].path[0] !== fileToParse) {
            return;
          }

          const pathToInterestingArray = parsingMetadata.GatherFromArray[DataObjectArray].path.slice(1);
          const interestingArray = extractValue(dataParsed, pathToInterestingArray, variables) as Array<any>;

          interestingArray.map((_, interestingArrayIndex) => {
            const gatheredResult: any = {};
            const ResolvedArray = extractValue(
              dataParsed,
              [...pathToInterestingArray, interestingArrayIndex],
              variables
            );
            parsingMetadata.GatherFromArray[DataObjectArray].attrsToGet.map((attrToGet) => {
              const extrectedArrayElement = extractValue(ResolvedArray, [attrToGet], variables);
              if (extrectedArrayElement) {
                gatheredResult[attrToGet] = extrectedArrayElement;
              }
            });
            //console.log('gatheredResult', gatheredResult);
            if (Object.keys(gatheredResult).length > 0) {
              if (parsedResults[DataObjectArray] === undefined) {
                parsedResults[DataObjectArray] = [];
              }
              parsedResults[DataObjectArray].push(gatheredResult);
            }
          });
        });
      });
    } catch (e) {
      this.emitter.emit('error', String(e));
      //setTimeout(() => this.internalLoop(parsingMetadata), this.internalLoopTimeout);
    }

    if (parsedResults['Id'] && parsedResults['SnapId']) {
      const DisplayName = parsedResults['SnapId'];
      const AccountID = parsedResults['Id'];
      //console.log(DisplayName, AccountID);
      if (!this.handleUserChangeEvent(AccountID, DisplayName)) {
        throw new Error('Parsing paused: newly detected user account must be synced or skipped');
      }
      this.currentState.state.screenName = DisplayName;
      this.currentState.state.userId = AccountID;
    }

    Object.keys(parsingMetadata.ExtractFromFilesCombo).map((ComboDataPointName) => {
      const parsedResult: any = {};
      parsingMetadata.ExtractFromFilesCombo[ComboDataPointName].slice(1).map((DataToPutInCombo) => {
        if (
          Object.keys(parsedResult).length > 0 &&
          DataToPutInCombo === 'TheFileTimestamp' &&
          nextFilesState[parsingMetadata?.ExtractFromFilesCombo[ComboDataPointName][0]]?.lastEdit
        ) {
          parsedResult[DataToPutInCombo] = (
            nextFilesState[parsingMetadata.ExtractFromFilesCombo[ComboDataPointName][0]].lastEdit.getTime() / 1000
          ).toFixed(0);
          return;
        }

        if (
          Object.keys(parsedResult).length > 0 &&
          DataToPutInCombo === 'StartTimestamp' &&
          this.currentState.state.filesStates[parsingMetadata?.ExtractFromFilesCombo[ComboDataPointName][0]]
            ?.lastEdit &&
          this.currentState.state.filesStates[parsingMetadata?.ExtractFromFilesCombo[ComboDataPointName][0]]
            ?.lastEdit instanceof Date
        ) {
          parsedResult[DataToPutInCombo] = (
            this.currentState.state.filesStates[
              parsingMetadata?.ExtractFromFilesCombo[ComboDataPointName][0]
            ]?.lastEdit.getTime() / 1000
          ).toFixed(0);
          return;
        }

        if (parsedResults[DataToPutInCombo]) {
          parsedResult[DataToPutInCombo] = parsedResults[DataToPutInCombo];
        }
        if (variables[DataToPutInCombo] !== undefined) {
          parsedResult[DataToPutInCombo] = variables[DataToPutInCombo];
        }
      });
      if (Object.keys(parsedResult).length > 0) {
        parsedResults[ComboDataPointName] = parsedResult;
      }
    });

    /*console.log('currentStateFiles', this.currentState.state.filesStates['GameState.json']);
    console.log('nextFilesState', nextFilesState['GameState.json']);*/
    //console.log('CardsInLocations', parsedResults['CardsInLocations']);

    const eventsToSend: ParseResults[] = [];
    //console.log(parsingMetadata.sendToServer);

    parsingMetadata.sendToServer.map((importantData) => {
      if (!parsedResults[importantData]) {
        return;
      }
      eventsToSend.push({
        time: 0,
        indicator: importantData,
        json: JSON.stringify(parsedResults[importantData]),
        //uid: this.currentState.state.userId ? this.currentState.state.userId : 0,
        uid: this.currentState.state.userId ? this.currentState.state.userId : '',
      });
    });

    if (latestUpdateDate !== undefined) {
      this.emitter.emit(
        'status',
        `<div class="stringTitle">Updated till:</div>${format(latestUpdateDate, 'h:mm:ss a dd, MMM yyyy')}`
      );
    }

    // Forwarding new data for server sending
    if (eventsToSend.length > 0) {
      gameState.checkProcessId();
      this.emitter.emit('newdata', {
        events: eventsToSend,
        parsingMetadata,
        state: {
          userId: this.currentState.state.userId,
          screenName: this.currentState.state.screenName,
          filesStates: nextFilesState,
        },
      });
    }
    /*console.log('state', this.currentState.state);
    console.log('nextFilesState', nextFilesState);*/
    // Saving new state for next batch
    Object.keys(nextFilesState).forEach((fst) => {
      this.currentState.state.filesStates[fst] = nextFilesState[fst];
    });

    //console.log(this.currentState.state);
    // Triggering next batch
    this.justStarted = false;
    const timeout = this.internalLoopTimeout;
    setTimeout(() => this.internalLoop(parsingMetadata), timeout);
  }

  private handleUserChangeEvent(newPlayerId: string, screenName: string): boolean {
    const account = settingsStore.getAccount();

    if (!this.currentState || this.currentState.state.userId !== newPlayerId) {
      sendMessageToHomeWindow('set-screenname', {screenName, newPlayerId});
      console.log('setting screename');
      console.log(screenName);
      //const overlayWindow = getOverlayWindow();
      /*if (account && settingsStore.get().overlay && overlayWindow !== undefined) {
        getUserMetadata(+account.uid)
          .then((umd) => sendMessageToOverlayWindow('set-userdata', umd))
          .catch((err) => {
            error('Failure to load User Metadata', err, {...account});
          });
      }*/
    }
    //console.log('account', account, account?.player, account?.player?.playerId, newPlayerId);
    if (account && account.player && account.player.playerId === newPlayerId) {
      return true;
    }
    //console.log('skipped through account confirmation');
    sendMessageToHomeWindow('show-status', {message: 'New User Detected!', color: '#dbb63d'});

    // If account is defined, it enforces that awaiting is undefined, because account has a screenName
    const settings = settingsStore.get();
    const newAccount = getAccountFromScreenName(screenName);
    if (newAccount !== undefined && newAccount.player) {
      if (settings.userToken !== undefined) {
        settings.userToken = newAccount.token;
      } else {
        settings.userToken = newAccount.token;
      }
      const userData: UserData = {
        snapId: newPlayerId,
        snapNick: screenName,
        token: newAccount.token,
      };
      const version = app.getVersion();
      setuserdata(userData).catch((err) =>
        error('Failure to set user data during a user change event', err, {...userData, version})
      );
      setCreds('userchange');
      settingsStore.save();
      return true;
    } else {
      sendMessageToHomeWindow('new-account', undefined);
      sendMessageToHomeWindow('show-prompt', {message: 'New SNAP account detected!', autoclose: 1000});
      settings.awaiting = {playerId: newPlayerId, screenName};
      this.stop();
      settingsStore.save();
      return false;
    }
  }
}
