import {ChildProcessWithoutNullStreams} from 'child_process';
import {app, screen} from 'electron';
import fs from 'fs';
import {jsonrepair} from 'jsonrepair';
import {join} from 'path';

import {gameState} from 'root/app/game_state';
import {sendMessageToOverlayWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import ourActiveWin from 'root/our-active-win';

export class WindowLocator {
  public bounds: {x: number; y: number; width: number; height: number} = {x: 0, y: 0, width: 0, height: 0};
  public isFullscreen: boolean = false;
  public SpawnedProcess: ChildProcessWithoutNullStreams | undefined;
  private severalPagesJSONReader: Buffer | undefined;

  private countBindings(processes: ourActiveWin.Result): void {
    const display = screen.getPrimaryDisplay();
    const xMargin = 6;
    const yMargin = 30;
    if (
      processes.bounds.y === 0 &&
      processes.bounds.width === display.bounds.width &&
      processes.bounds.height === display.bounds.height
    ) {
      //console.log('FullScreen!');
      this.isFullscreen = true;
      const monitorNumber = processes.bounds.x / processes.bounds.width;
      this.bounds = {
        x: monitorNumber * display.bounds.width,
        y: 0,
        width: display.bounds.width,
        height: display.bounds.height,
      };
    } else {
      this.isFullscreen = false;
      this.bounds = {
        x: processes.bounds.x + xMargin,
        y: processes.bounds.y + yMargin,
        width: processes.bounds.width - xMargin,
        height: processes.bounds.height - yMargin,
      };
      //console.log(this.bounds);
    }
    gameState.overlayPositionSetter(true);
    //console.log(display);
    //console.log(processes.bounds);
  }

  private isSnapWindow(process: ourActiveWin.Result): boolean {
    return process.title === 'SNAP' && gameState.getProcessId() === process.owner.processId;
  }

  private handleRepositioning(process: ourActiveWin.Result | undefined): void {
    if (process && this.isSnapWindow(process)) {
      this.countBindings(process);
      sendMessageToOverlayWindow('need-to-restart-mtga', process.admin);
      //console.log(process);
    } else {
      this.bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      gameState.overlayPositionSetter(true);
      //console.log(this.bounds);
    }
  }

  private getWhatDeckIsSelected(): string {
    try {
      const specialpath = settingsStore.get().logPath;
      let path = '';
      if (specialpath !== undefined) {
        path = join(specialpath, 'PlayState.json');
      }
      path = join(
        app.getPath('appData'),
        'LocalLow',
        'Second Dinner',
        'SNAP',
        'Standalone',
        'States',
        'nvprod',
        'PlayState.json'
      ).replace('Roaming\\', '');
      const data = fs.readFileSync(path, {encoding: 'utf8', flag: 'r'});
      const dataParsed = JSON.parse(data.slice(data.indexOf('{')));
      gameState.setSelectedDeck(dataParsed.SelectedDeckId.Value);
      return dataParsed.SelectedDeckId.Value;
    } catch (e) {
      console.log('getWhatDeckIsselected', e);
      return '';
    }
  }

  private readonly interestingStrings = [
    'CubeGame.GameCreateChange',
    'CubeGame.GameCreatePlayerChange',
    'CubeGame.GameCreateLocationChange',
    'CubeGame.GameCreateCardChange',
    'CubeGame.GameRevealCardChange',
    'CubeGame.CardMoveChange',
    'CubeGame.GameResultChange',
  ];

  private handleChangesData(changes: any[]): void {
    //console.log('changes', changes);
    const userID = settingsStore.getAccount()?.player?.playerId;
    if (userID === undefined) {
      return;
    }
    changes.forEach((change) => {
      const typeSplitted = change['$type'].split(', ');
      //console.log(typeSplitted[0], JSON.stringify(change));
      switch (typeSplitted[0]) {
        case 'CubeGame.GameCreateChange':
          const selectedDeckId = this.getWhatDeckIsSelected();
          //console.log(selectedDeckId);

          if (
            change?.GameModeData !== undefined &&
            change?.GameModeData?.['$type'] !== undefined &&
            change?.GameModeData?.['$type']?.includes('BattleGameModeData') &&
            change?.GameModeData?.BattleHistory?.GameResults !== undefined
          ) {
            gameState.startBattleMode(change?.GameModeData?.BattleHistory?.GameResults);
          } else {
            gameState.startNormalMatch();
          }

          sendMessageToOverlayWindow('match-started', {
            matchId: change.Id,
            players: [
              change.Players[0].PlayerInfo.AccountId as string,
              change.Players[1].PlayerInfo.AccountId as string,
            ],
            playerNicks: [change.Players[0].PlayerInfo.Name as string, change.Players[1].PlayerInfo.Name as string],
            uid: userID,
            selectedDeckId,
            isBattle:
              change?.GameModeData !== undefined &&
              change?.GameModeData?.['$type'] !== undefined &&
              change?.GameModeData?.['$type']?.includes('BattleGameModeData'),
            isNewBattle:
              Array.isArray(change?.GameModeData?.BattleHistory?.GameResults) &&
              change?.GameModeData?.BattleHistory.GameResults.length === 0,
          });
          break;
        case 'CubeGame.GameCreatePlayerChange':
          sendMessageToOverlayWindow('match-set-player', {
            accountId: change.PlayerInfo.AccountId,
            name: change.PlayerInfo.Name,
            entityId: +change.EntityId,
            deckEntityId: +change.DeckEntityId,
            graveyardEntityId: +change.GraveyardEntityId,
            handEntityId: +change.HandEntityId,
            CardBackDefId: change.PlayerInfo.CardBack.CardBackDefId
              ? change.PlayerInfo.CardBack.CardBackDefId
              : 'Snap_01',
          });
        case 'CubeGame.GameCreateLocationChange':
          sendMessageToOverlayWindow('match-set-location', {
            entityId: change.EntityId,
            locationSlot: change.LocationSlot,
          });
          break;
        case 'CubeGame.GameCreateCardChange':
          sendMessageToOverlayWindow('match-create-card-entity', {
            entityId: change.EntityId,
            ownerEntityId: change.OwnerEntityId,
            zoneEntityId: change.ZoneEntityId,
          });
          break;
        case 'CubeGame.GameRevealCardChange':
          //console.log(change);
          if (change.CreatedByCardDefId === undefined && change.CreatedByLocationDefId === undefined) {
            sendMessageToOverlayWindow('match-card-reveal', {
              entityId: change.EntityId,
              cardDefId: change.CardDefId,
              rarityDefId: change.RarityDefId,
              artVariantDefId: change.ArtVariantDefId,
            });
          }
          break;
        case 'CubeGame.CardMoveChange':
          sendMessageToOverlayWindow('match-card-move', {
            cardEntityId: change.CardEntityId,
            cardOwnerEntityId: change.CardOwnerEntityId,
            targetZoneEntityId: change.TargetZoneEntityId,
          });
          break;
        case 'CubeGame.GameResultChange':
          /*console.log('GameResultChange');
          console.log(change);*/
          const cubes = +change?.Message?.FinalCubeValue;
          const winner =
            change?.Message?.GameResultAccountItems[0]?.IsWinner === true
              ? change?.Message?.GameResultAccountItems[0]?.AccountId
              : change?.Message?.GameResultAccountItems[1]?.IsWinner === true
                ? change?.Message?.GameResultAccountItems[1]?.AccountId
                : undefined;
          if (+change?.Message?.IsBattleMode) {
            gameState.updateBattleDeckStats(winner, cubes);
          } else {
            gameState.updateDeckStats(winner, cubes);
          }
          break;
      }
    });
  }

  private brutallyParseJSON(raw: string): void {
    /*try {
      const test = JSON.parse(raw);
    } catch (e) {
      console.log(e);
      console.log('-------------------testing error!------------------------');
      console.log(raw);
    }*/
    const changesIndex = raw.indexOf('"Changes":[');
    const lastCloseBracket = raw.lastIndexOf(']');

    if (changesIndex === -1) {
      return;
    }

    const changesString = raw.substring(changesIndex + '"Changes":['.length, lastCloseBracket);
    const changesArray: string[] = [];
    const changes: any[] = [];
    //console.log('brutallyParseJSON', changesArray);
    let squareBracket = 0;
    let curlyBracket = 0;
    let prevCursor = 0;
    for (let cursor = 0; cursor < changesString.length; cursor++) {
      const currentChar = changesString.charAt(cursor);
      if (currentChar === '{') {
        curlyBracket++;
      } else if (currentChar === '}') {
        curlyBracket--;
      } else if (currentChar === '[') {
        squareBracket++;
      } else if (currentChar === ']') {
        squareBracket--;
      }

      if (curlyBracket === 0 && squareBracket === 0 && (currentChar === ',' || cursor === changesString.length - 1)) {
        changesArray.push(changesString.substring(prevCursor, currentChar === ',' ? cursor : cursor + 1));
        prevCursor = cursor + 1;
      }
    }

    //console.log('brutallyParseJSON', changesArray);

    changesArray.forEach((change) => {
      for (let i = 0; i <= this.interestingStrings.length - 1; i++) {
        const interestingString = this.interestingStrings[i];
        if (change.indexOf(interestingString) !== -1) {
          try {
            const changeParsed = JSON.parse(jsonrepair(change));
            changes.push(changeParsed);
          } catch (e) {
            console.log('-------------brutallyParseJSONerror-----------');
            console.log(e);
            console.log(change);
          }
          break;
        }
      }
    });

    /*const path = join(app.getPath('userData'), 'debugging.txt');
    fs.appendFileSync(path, JSON.stringify(changes) + '\r\n\r\n\r\n');*/

    //console.log('brutallyParseJSON', changes);

    if (changes.length > 0) {
      this.handleChangesData(changes);
    }

    /*if (process['$type'] !== undefined) {
      this.handleChangesData(process);
    }

    const changesArray = process['changes'];
    if (!Array.isArray(changesArray)) {
      return;
    }*/
  }

  public ProcessData(stdout: Buffer): void {
    try {
      const raw = String(stdout);
      if (raw === '') {
        return;
      }

      //const path = join(app.getPath('userData'), 'debugging.txt');

      try {
        //fs.appendFileSync(path, raw + '\r\n\r\n\r\n');
        raw
          .trim()
          .split('\n')
          .map((line: string) => {
            const trimmedLine = line.trim();
            if (trimmedLine.indexOf('"bounds":{') !== -1) {
              const process = JSON.parse(trimmedLine) as Record<string, any>;
              this.handleRepositioning(process as ourActiveWin.Result);
            } else if (trimmedLine.charAt(0) === '{' && trimmedLine.charAt(trimmedLine.length - 1) === '}') {
              this.brutallyParseJSON(trimmedLine);
            } else if (trimmedLine.charAt(0) === '{' && trimmedLine.charAt(trimmedLine.length - 1) !== '}') {
              this.severalPagesJSONReader = stdout;
            } else if (
              trimmedLine.charAt(0) !== '{' &&
              trimmedLine.charAt(trimmedLine.length - 1) !== '}' &&
              trimmedLine.indexOf('{') !== -1 &&
              trimmedLine.indexOf('}') !== -1 &&
              this.severalPagesJSONReader !== undefined
            ) {
              this.severalPagesJSONReader = Buffer.concat([this.severalPagesJSONReader, stdout]);
            } else if (
              trimmedLine.charAt(0) !== '{' &&
              trimmedLine.charAt(trimmedLine.length - 1) === '}' &&
              this.severalPagesJSONReader !== undefined
            ) {
              this.severalPagesJSONReader = Buffer.concat([this.severalPagesJSONReader, stdout]);
              const raw = String(this.severalPagesJSONReader);
              this.brutallyParseJSON(raw.trim());
            }
          });
      } catch (error) {
        console.log('ProcessData!');
        console.log(error);
        console.log('-----------------------');
        console.log(this.severalPagesJSONReader);
        console.log('-----------------------');
        console.log(raw);
        //throw new Error('Error parsing window data');
      }
    } catch (error) {
      console.log('ProcessDataGlobalFail!');
    }
  }

  public killSpawnedProcess(): void {
    if (this.SpawnedProcess) {
      this.SpawnedProcess.kill();
    }
  }

  public findAndHookSnap(): void {
    /*const path = join(app.getPath('userData'), 'debugging.txt');
    fs.appendFileSync(path, JSON.stringify({pid}));*/
    //console.log('findAndHookSnap');
    try {
      this.SpawnedProcess = ourActiveWin.launch();
      if (this.SpawnedProcess) {
        this.SpawnedProcess.stdout.on('data', this.ProcessData.bind(this));
      }
    } catch (e) {
      console.log('findAndHookSnap', e);
      //fs.appendFileSync(path, e);
    }
  }
}
