import {Cards} from 'root/models/cards';
import {Request} from 'root/app/request';

export async function getCards(): Promise<Cards> {
  const res = await Request.get('/snap/do.php?cmd=getcards', {
    url: 'https://static2.marvelsnap.pro/snap/do.php?cmd=getcards',
  });

  return res;
}
