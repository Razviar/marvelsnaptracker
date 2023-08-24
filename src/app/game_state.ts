import {exec, execFile} from 'child_process';
import {join} from 'path';
import {BrowserWindow} from 'electron';
import electronIsDev from 'electron-is-dev';
import psList from 'ps-list';
import {registerHotkeys, unRegisterHotkeys} from 'root/app/hotkeys';
import {WindowLocator} from 'root/app/locatewindow';
import {withLogParser} from 'root/app/log_parser_manager';
import {sendMessageToHomeWindow, sendMessageToOverlayWindow} from 'root/app/messages';
import {createOverlayWindow, getOverlayWindow} from 'root/app/overlay_window';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';
import {hasOwnProperty} from 'root/lib/type_utils';
import {sleep} from 'root/lib/utils';
import {UserDeck} from 'root/models/snap_deck';

const FIVE_SECONDS = 5000;

class GameState {
  private readonly startTimeMillis: number;
  private running: boolean;
  private AVBlocked: boolean;
  private psListInterval: NodeJS.Timeout | undefined;
  private processId: number | undefined;
  private badErrorHappening: boolean = false;
  private refreshMillis = 1000;
  private readonly processName = 'SNAP.exe';
  private processPath: string | undefined = '';
  private readonly movementSensitivity = 1;
  private readonly overlayPositioner = new WindowLocator();
  private overlayIsPositioned = false;
  public isFullscreen: boolean = false;
  private decks: UserDeck[] = [];
  private selectedDeck: string = '';
  private deckStats: Record<string, {win: number; loss: number; cube_win: number; cube_loss: number}> = {};
  public isDoingBattle: Boolean = false;
  public battleScores: [number, number] = [10, 10];

  constructor() {
    this.startTimeMillis = Date.now();
    this.running = false;
    this.AVBlocked = false;
    this.checkProcessId();
  }

  public startBattleMode(GameResults: any) {
    this.isDoingBattle = true;
    const account = settingsStore.getAccount();
    const userId = account?.player?.playerId;
    this.battleScores = [10, 10];
    GameResults.forEach((gameResult: any) => {
      const cubeValue = gameResult.FinalCubeValue;
      const ourResult = gameResult.GameResultAccountItems.find((res: any) => res.AccountId === userId);
      if (ourResult.IsWinner && ourResult.IsWinner === true) {
        this.battleScores[1] -= cubeValue;
      } else if (ourResult.IsLoser && ourResult.IsLoser === true) {
        this.battleScores[0] -= cubeValue;
      }
    });
    //console.log('startBattleMode',this.battleScores);
  }

  public startNormalMatch() {
    this.isDoingBattle = false;
    this.battleScores = [10, 10];
  }

  public updateBattleDeckStats(winner: string | undefined, cubes: number) {
    const account = settingsStore.getAccount();
    const userId = account?.player?.playerId;
    const isWinner = winner === userId;
    if (winner !== undefined) {
      if (isWinner) {
        this.battleScores[1] -= cubes;
      } else {
        this.battleScores[0] -= cubes;
      }
    }
    //console.log('updateBattleDeckStats', this.battleScores);

    if (this.battleScores[0] === 0 || this.battleScores[1] === 0) {
      this.isDoingBattle = false;
      this.battleScores = [10, 10];
      sendMessageToOverlayWindow('stats-update', this.deckStats);
    }
  }

  public updateDeckStats(winner: string | undefined, cubes: number) {
    const account = settingsStore.getAccount();
    const userId = account?.player?.playerId;
    const isWinner = winner === userId;
    if (winner !== undefined) {
      if (this.deckStats[this.selectedDeck] !== undefined) {
        this.deckStats[this.selectedDeck].win += isWinner ? 1 : 0;
        this.deckStats[this.selectedDeck].loss += isWinner ? 0 : 1;
        this.deckStats[this.selectedDeck].cube_win += isWinner ? cubes : 0;
        this.deckStats[this.selectedDeck].cube_loss += isWinner ? 0 : cubes;
      } else {
        this.deckStats[this.selectedDeck] = {win: 0, loss: 0, cube_win: 0, cube_loss: 0};
        this.deckStats[this.selectedDeck].win = isWinner ? 1 : 0;
        this.deckStats[this.selectedDeck].loss = isWinner ? 0 : 1;
        this.deckStats[this.selectedDeck].cube_win = isWinner ? cubes : 0;
        this.deckStats[this.selectedDeck].cube_loss = isWinner ? 0 : cubes;
      }
    }
    /*console.log(this.deckStats);
    console.log(userId, winner);*/
    sendMessageToOverlayWindow('stats-update', this.deckStats);
  }

  public getDecks() {
    return this.decks;
  }

  public setDecks(d: UserDeck[]) {
    this.decks = d;
    sendMessageToOverlayWindow('decks-message', d);
    //console.log(this.decks);
  }

  public getSelectedDeck() {
    return this.selectedDeck;
  }

  public setSelectedDeck(d: string) {
    this.selectedDeck = d;
    sendMessageToOverlayWindow('deck-message', d);
    //console.log(this.selectedDeck);
  }

  public getStartTime(): number {
    return this.startTimeMillis;
  }

  public setAVBlocked() {
    this.AVBlocked = true;
  }

  public getAVBlocked() {
    return this.AVBlocked;
  }

  public setRunning(running: boolean): void {
    //console.log('setRunning', running, this.running, this.badErrorHappening);
    if (!this.running && running) {
      this.running = true;
      this.startOverlay();
      this.psListInterval = setInterval(() => this.checkProcessId(), this.refreshMillis);
      withLogParser((logParser) => {
        logParser.changeParserFreq(undefined).catch((err) => {
          error('Failure to start log parser', err);
        });
      });
    } else if (this.running && !running) {
      this.running = running;
      if (this.psListInterval) {
        clearInterval(this.psListInterval);
        this.psListInterval = undefined;
      }
      withLogParser((logParser) => {
        logParser.changeParserFreq(FIVE_SECONDS).catch((err) => {
          error('Failure to start log parser', err);
        });
      });
      if (this.badErrorHappening) {
        //console.log('switching off bad error mode');
        this.processId = undefined;
        this.badErrorHappening = false;
      }
      const overlayWindow = getOverlayWindow();
      if (overlayWindow) {
        this.hideOverlay(overlayWindow);
      }
      sendMessageToHomeWindow('show-status', {message: 'Game is not running!', color: '#dbb63d'});
    }
  }

  public sendInitialMessages(): void {
    //console.log('sendInitialMessages!');
    const account = settingsStore.getAccount();
    const ovlSettings = account?.overlaySettings;
    sendMessageToOverlayWindow('set-ovlsettings', ovlSettings);
    sendMessageToOverlayWindow('deck-message', this.selectedDeck);
    sendMessageToOverlayWindow('decks-message', this.decks);
  }

  public overlayPositionSetter(onlySetPosition?: boolean): void {
    const account = settingsStore.getAccount();
    if (!account || !settingsStore.get().overlay) {
      return;
    }
    if (!onlySetPosition) {
      this.overlayPositioner.findAndHookSnap();
    }

    if (account === undefined) {
      return;
    }

    let overlayWindow = getOverlayWindow();
    const ovlSettings = account.overlaySettings;
    if (!overlayWindow) {
      overlayWindow = createOverlayWindow();
      /*console.log('Creating!');
      console.log(this.selectedDeck);
      console.log(this.decks);*/
      setTimeout(this.sendInitialMessages.bind(this), 500);
    }
    /*if (electronIsDev) {
        console.log('Got new bounds', this.overlayPositioner.bounds);
      }*/

    if (
      this.overlayPositioner.bounds.width !== 0 &&
      (Math.abs(overlayWindow.getBounds().x - this.overlayPositioner.bounds.x) > this.movementSensitivity ||
        Math.abs(overlayWindow.getBounds().y - this.overlayPositioner.bounds.y) > this.movementSensitivity ||
        Math.abs(overlayWindow.getBounds().width - this.overlayPositioner.bounds.width) > this.movementSensitivity ||
        Math.abs(overlayWindow.getBounds().height - this.overlayPositioner.bounds.height) > this.movementSensitivity ||
        !this.overlayIsPositioned)
    ) {
      this.showOverlay(overlayWindow);
      const EtalonHeight = 1144;
      const zoomFactor = this.overlayPositioner.bounds.height / EtalonHeight;
      sendMessageToOverlayWindow('set-zoom', zoomFactor);
      try {
        overlayWindow.setBounds(this.overlayPositioner.bounds);
        this.overlayIsPositioned = true;
      } catch (err) {
        console.log('overlayPositionSetter');
        error("couldn't set overlay bounds, hiding overlay for now", err);
        this.hideOverlay(overlayWindow);
      }
    } else if (
      (this.overlayPositioner.bounds.width === 0 && (!ovlSettings || !ovlSettings.neverhide)) ||
      !this.overlayIsPositioned
    ) {
      this.hideOverlay(overlayWindow);
    } else {
      this.showOverlay(overlayWindow);
    }
  }

  private startOverlay(): void {
    //console.log('Starting Overlay new way!');
    this.overlayPositionSetter(false);
  }

  private showOverlay(overlayWindow: BrowserWindow): void {
    /*if (electronIsDev) {
      console.log('Showing Overlay');
    }*/
    if (!overlayWindow.isVisible()) {
      registerHotkeys();
      setTimeout(overlayWindow.show.bind(overlayWindow), 400);
    }
  }

  private hideOverlay(overlayWindow: BrowserWindow): void {
    unRegisterHotkeys();
    overlayWindow.hide();
  }

  public getProcessId(): number {
    return this.processId ?? -1;
  }

  public checkProcessId(): void {
    if (this.processId !== undefined && !this.badErrorHappening) {
      try {
        process.kill(this.processId, 0);
      } catch (e: unknown) {
        console.log('checkProcessId');
        if (e instanceof Object && hasOwnProperty(e, 'code') && e.code === 'ESRCH') {
          //console.log('got good error');
          this.processId = undefined;
          this.badErrorHappening = false;
          this.setRunning(false);
        } else {
          this.badErrorHappening = true;
          //console.log('got bad error');
        }
      }
    } else {
      if (electronIsDev) {
        console.log('pinging psList');
      }
      psList()
        .then((processes) => {
          const res = processes.find((proc) => proc.name === this.processName);
          if (res !== undefined) {
            console.log('found SNAP');
            if (!this.badErrorHappening) {
              console.log('setting PID');
              this.processId = res.pid;
              exec(`wmic process where "ProcessID=${this.processId}" get ExecutablePath`, (e, out) => {
                out.split('\n').forEach((splitted) => {
                  if (splitted.includes('SNAP.exe')) {
                    this.processPath = splitted;
                    console.log(this.processPath);
                  }
                });
              });
              /*this.processPath = res.cmd;
              console.log(res);*/
            }
            this.setRunning(true);
          } else {
            //console.log('not found MTGA');
            if (this.badErrorHappening) {
              //console.log('not found MTGA, doing what needs to be done');
              this.processId = undefined;
              this.setRunning(false);
            }
          }
        })
        .catch(() => {
          console.log('psList error');
        });
    }

    if (this.overlayPositioner.SpawnedProcess && !this.running) {
      this.overlayPositioner.killSpawnedProcess();
    }
  }

  public async doMTGARestart(): Promise<void> {
    try {
      if (
        this.processId !== undefined &&
        this.processPath !== undefined &&
        this.processPath !== '' &&
        this.processPath.includes('SNAP')
      ) {
        exec(`wmic process where "ProcessID=${this.processId}" delete`).unref();
        this.setRunning(false);
        await sleep(1000);
        console.log(this.processPath);
        execFile(this.processPath).unref();
        await sleep(1000);
        this.checkProcessId();
      }
    } catch (e) {
      // tslint:disable-next-line: no-console
      console.log(e);
    }
  }
}

export const gameState = new GameState();
