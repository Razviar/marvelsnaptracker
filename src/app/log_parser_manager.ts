import electronIsDev from 'electron-is-dev';

import {sendEventsToServer} from 'root/api/logsender';
import {gameState} from 'root/app/game_state';
import {LogParser} from 'root/app/log-parser/log_parser';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {settingsStore} from 'root/app/settings-store/settings_store';
import {error} from 'root/lib/logger';

export type MaybeLogParser = LogParser | undefined;
let logParser: MaybeLogParser;

export function getLogParser(): LogParser | undefined {
  return logParser;
}

export function withLogParser(fn: (logParser: LogParser) => void): void {
  if (logParser === undefined) {
    return;
  }
  fn(logParser);
}

export function createGlobalLogParser(dev?: boolean): LogParser {
  logParser = new LogParser();

  logParser.emitter.on('newdata', (data) => {
    if (data.events.length > 0) {
      const userToken = settingsStore.get().userToken;
      if (userToken !== undefined && userToken.includes('SKIPPING')) {
        sendMessageToHomeWindow('show-status', {message: 'Skipping this account...', color: '#dbb63d'});
        return;
      }
      if (dev) {
        //console.log(data.events);
        // tslint:disable-next-line: no-console
        console.log('There will be sent this number of events: ', data.events.length);
        if (data.events.length > 0) {
          // tslint:disable-next-line: no-console
          console.log('This is user ID:', data.events[0].uid);
        }
        // tslint:disable-next-line: no-console no-magic-numbers
        //console.log(data.events.filter((ev) => ev.indicator === 15));
      }
      sendEventsToServer(data.events, data.parsingMetadata.logSender, data.state);
    }
  });

  logParser.emitter.on('decks-message', (msg) => {
    //if (settingsStore.get().overlay) {
    gameState.setDecks(msg);
    //sendMessageToOverlayWindow('decks-message', msg);
    //}
  });

  logParser.emitter.on('error', (msg) => {
    console.log(msg);
    sendMessageToHomeWindow('show-status', {message: msg, color: '#cc2d2d'});
  });

  logParser.emitter.on('status', (msg) => {
    sendMessageToHomeWindow('show-status', {message: msg, color: '#22a83a'});
  });

  logParser.emitter.on('nologfile', () => {
    sendMessageToHomeWindow('nologfile', undefined);
  });

  if (electronIsDev) {
    // tslint:disable-next-line: no-console
    console.log('Starting parser from Global...');
  }

  logParser.start().catch((err) => {
    error('Failure to start parser', err);
  });

  return logParser;
}
