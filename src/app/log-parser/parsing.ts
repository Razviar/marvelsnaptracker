import {LogEvent, LogFileParsingState, ParsingMetadata, RawLogEvent, StatefulLogEvent} from 'root/app/log-parser/model';
import {getObject} from 'root/lib/func';
import {asArray, asMap, asNumber, asString} from 'root/lib/type_utils';

export function logEventToStatefulEvent(event: LogEvent, state: LogFileParsingState): StatefulLogEvent {
  return {
    ...event,
    userId: state.userId,
    timestamp: state.filesStates[0].lastEdit.getTime(),
  };
}

// tslint:disable-next-line:no-any
export function parseAsJSONIfNeeded(data: any): any {
  // The heuristic here is that we will parse the data as a JSON if it's a
  // non-empty string that starts with '{'
  if (typeof data === 'string' && data.length > 0 && data[0] === '{') {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.log('Error parsing JSON', err);
    }
  } else if (typeof data === 'string' && data.length > 0 && data[0] !== '{' && data.indexOf('{') < 10) {
    try {
      return JSON.parse(data.slice(data.indexOf('{')));
    } catch (err) {
      console.log('Error parsing JSON', err);
    }
  }
  return data;
}

// tslint:disable-next-line:no-any
export function extractValue(data: any, attributesPath: (number | string)[]): any {
  let value = parseAsJSONIfNeeded(data);
  for (const attribute of attributesPath) {
    value = asMap(value, {})[attribute];
    if (value && value['$ref']) {
      value = getObject(data, '$id', value['$ref']);
    }
  }
  return value;
}
