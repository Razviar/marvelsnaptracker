import electronIsDev from 'electron-is-dev';
import psList from 'ps-list';
import {withLogParser} from 'root/app/log_parser_manager';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {error} from 'root/lib/logger';
import {hasOwnProperty} from 'root/lib/type_utils';

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
  public isFullscreen: boolean = false;

  constructor() {
    this.startTimeMillis = Date.now();
    this.running = false;
    this.AVBlocked = false;
    this.checkProcessId();
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
      sendMessageToHomeWindow('show-status', {message: 'Game is not running!', color: '#dbb63d'});
    }
  }

  public getProcessId(): number {
    return this.processId ?? -1;
  }

  public checkProcessId(): void {
    if (this.processId !== undefined && !this.badErrorHappening) {
      try {
        //console.log('trying to kill', this.processId);
        process.kill(this.processId, 0);
      } catch (e: unknown) {
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
        //console.log('pinging psList');
      }
      psList()
        .then((processes) => {
          const res = processes.find((proc) => proc.name === this.processName);
          if (res !== undefined) {
            console.log('found SNAP');
            if (!this.badErrorHappening) {
              console.log('setting PID');
              this.processId = res.pid;
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
        .catch(() => {});
    }
  }
}

export const gameState = new GameState();
