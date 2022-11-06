import {app, BrowserWindow, Menu, MenuItemConstructorOptions, shell} from 'electron';

import {error} from 'root/lib/logger';

export function createContextMenuForMainWindow(mainWindow: BrowserWindow): Menu {
  const MenuLinks: MenuItemConstructorOptions[] = [];
  const MenuLabels: {[index: string]: string} = {
    'My Profile': 'https://marvelsnap.pro//u/',
    Deckbuilder: 'https://marvelsnap.pro//deckbuilder/',
    'Deck Converter': 'https://marvelsnap.pro//converter/',
    Decks: 'https://marvelsnap.pro//decks/?my',
    Collection: 'https://marvelsnap.pro//collection/',
    Progress: 'https://marvelsnap.pro//progress/',
    Events: 'https://marvelsnap.pro//events/',
    Matches: 'https://marvelsnap.pro//matches/',
    Rewards: 'https://marvelsnap.pro//rewards/',
    Boosters: 'https://marvelsnap.pro//boosters/',
  };

  Object.keys(MenuLabels).forEach((label) => {
    MenuLinks.push({
      label,
      click: () => {
        shell
          .openExternal(MenuLabels[label])
          .catch((err) =>
            error('Error while opening an external link from the context menu', err, {label, url: MenuLabels[label]})
          );
      },
    });
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Tracker',
      click: () => {
        mainWindow.show();
      },
    },
    {type: 'separator'},
    ...MenuLinks,
    {type: 'separator'},
    {
      label: 'Stop Tracker',
      click: () => {
        app.quit();
      },
    },
  ]);

  return contextMenu;
}
