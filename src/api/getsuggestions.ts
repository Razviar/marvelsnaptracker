import {Request} from 'root/app/request';

export async function getSuggestions(deck: string[]): Promise<string[]> {
  const res = await Request.post<{deck: string[]}>('/snap/do.php?cmd=suggestions', {
    deck,
  });

  return res;
}
