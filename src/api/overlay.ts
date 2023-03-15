import {app} from 'electron';

import {parseMetadata} from 'root/api/parseMetadata';
import {parseUserMetadata} from 'root/api/parseUserMetadata';
import {AxiosResponse, Request} from 'root/app/request';
import {error} from 'root/lib/logger';
import {asArray, asMap, asNumber, asString, removeUndefined} from 'root/lib/type_utils';
import {isMac} from 'root/lib/utils';
import {UserMetadata} from 'root/models/metadata';

export async function getUserMetadata(uid: number): Promise<UserMetadata> {
  return parseUserMetadata(
    await Request.get(`/snap/donew2.php?cmd=getuserdata&version=${app.getVersion()}${isMac() ? 'm' : 'w'}&uid=${uid}`)
  );
}
