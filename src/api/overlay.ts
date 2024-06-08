import {app} from 'electron';

import {parseUserMetadata} from 'root/api/parseUserMetadata';
import {Request} from 'root/app/request';
import {isMac} from 'root/lib/utils';
import {UserMetadata} from 'root/models/metadata';

export async function getUserMetadata(uid: number): Promise<UserMetadata> {
  return parseUserMetadata(
    await Request.get(`/snap/donew2.php?cmd=getuserdata&version=${app.getVersion()}${isMac() ? 'm' : 'w'}&uid=${uid}`)
  );
}
