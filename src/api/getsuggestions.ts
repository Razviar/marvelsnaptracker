import {Request} from 'root/app/request';
import {Suggestions} from 'root/models/suggestions';

export async function getSuggestions(deck: string[]): Promise<Suggestions> {
  const res = await Request.post<{deck: string[]}>('/snap/do.php?cmd=suggestionstracker', {
    deck,
  });

  return res;
}
