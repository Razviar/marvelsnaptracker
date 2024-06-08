import {OverlaySettings} from 'root/app/settings-store/settings_store';
import {SnapCard} from 'root/models/snap_deck';
import {onMessageFromIpcMain, sendMessageToIpcMain} from 'root/windows/messages';
import {dragger} from 'root/windows/overlay/functions/dragger';
import {drawDeck} from 'root/windows/overlay/functions/drawdeck';
import {drawSession} from 'root/windows/overlay/functions/drawsession';
import {opacityIncrement, scaleIncrement} from 'root/windows/overlay/functions/sethandlers';
import {opacitySetter, scalesetter} from 'root/windows/overlay/functions/setters';
import {updateDeck} from 'root/windows/overlay/functions/updatedeck';
import {updatelinks} from 'root/windows/overlay/functions/updatelinks';
import {updateOppDeck} from 'root/windows/overlay/functions/updateoppdeck';
import {currentMatch, icons, overlayConfig, overlayElements, playerDecks} from 'root/windows/overlay/overlay';

export function SetMessages(setInteractiveHandler: (overlaySettings: OverlaySettings | undefined) => void): void {
  onMessageFromIpcMain('set-icosettings', (ico) => {
    if (ico !== undefined) {
      overlayConfig.icon = ico;
    }
    Object.keys(icons).forEach((i) => {
      overlayElements.LogoSpan.classList.remove(`ms-${icons[i]}`);
    });
    overlayElements.LogoSpan.classList.add(`ms-${icons[overlayConfig.icon]}`);
  });

  onMessageFromIpcMain('set-ovlsettings', (settings) => {
    //console.log('setting settings');
    overlayConfig.ovlSettings = settings;

    try {
      setInteractiveHandler(settings);

      if (overlayConfig.ovlSettings && overlayConfig.justcreated) {
        overlayConfig.currentScale =
          overlayConfig.ovlSettings.savescale !== 0 ? overlayConfig.ovlSettings.savescale : 1;

        if (overlayConfig.ovlSettings.savepositionleft !== 0) {
          overlayElements.MainDeckFrame.style.top = `${overlayConfig.ovlSettings.savepositiontop}%`;
          overlayElements.MainDeckFrame.style.left = `${overlayConfig.ovlSettings.savepositionleft}%`;
        }
        if (overlayConfig.ovlSettings.savepositionleftopp !== 0) {
          overlayElements.OpponentOutFrame.style.top = `${overlayConfig.ovlSettings.savepositiontopopp}%`;
          overlayElements.OpponentOutFrame.style.left = `${overlayConfig.ovlSettings.savepositionleftopp}%`;
        }

        overlayConfig.currentOpacity = overlayConfig.ovlSettings.opacity !== 0 ? overlayConfig.ovlSettings.opacity : 1;
      }

      if (
        overlayConfig.ovlSettings &&
        overlayConfig.ovlSettings.savepositionleft === 0 &&
        overlayConfig.ovlSettings.savepositiontop === 0
      ) {
        overlayElements.MainDeckFrame.style.top = '15%';
        overlayElements.MainDeckFrame.style.left = '0px';
      }

      if (
        overlayConfig.ovlSettings &&
        overlayConfig.ovlSettings.savepositionleftopp === 0 &&
        overlayConfig.ovlSettings.savepositiontopopp === 0
      ) {
        overlayElements.OpponentOutFrame.style.top = '15%';
        overlayElements.OpponentOutFrame.style.right = '0px';
      }

      if (overlayConfig.ovlSettings && overlayConfig.ovlSettings.cardsinarow) {
        overlayConfig.cardsInARow = +overlayConfig.ovlSettings.cardsinarow;
      }
    } catch (e) {}

    scalesetter(false);
    dragger(overlayElements.MainDeckFrame, overlayElements.MoveHandle);
    dragger(overlayElements.OpponentOutFrame, overlayElements.OppMoveHandle);
    opacitySetter(false);
    updatelinks();

    if (currentMatch.matchId !== '') {
      updateDeck([]);
    }
    drawSession();
    overlayConfig.justcreated = false;
  });

  onMessageFromIpcMain('set-zoom', (zoom) => {
    sendMessageToIpcMain('set-scale', zoom);
  });

  onMessageFromIpcMain('cards-message', (cards) => {
    overlayConfig.allCards = cards;
    //console.log(overlayConfig.allCards);
  });

  onMessageFromIpcMain('bots-message', (bots) => {
    overlayConfig.allBots = bots;
    //console.log(overlayConfig.allBots);
  });

  onMessageFromIpcMain('match-started', (newMatch) => {
    console.log('match-started', newMatch);
    const ourPlayerPosition: 0 | 1 = newMatch.players[0] === newMatch.uid ? 0 : 1;
    currentMatch.opponentNick = newMatch.playerNicks[ourPlayerPosition === 0 ? 1 : 0];

    if (currentMatch.matchId !== '') {
      currentMatch.over(!newMatch.isBattle || newMatch.isNewBattle);
    }

    overlayConfig.selectedDeck = newMatch.selectedDeckId;
    overlayElements.MainDeckFrame.classList.add('hidden');
    //(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
    currentMatch.matchId = newMatch.matchId;
    currentMatch.ourUid = newMatch.uid;
    const selectedDeck = playerDecks.find((d) => d.id === overlayConfig.selectedDeck);
    const selectedDeckStrings: SnapCard[] = [];
    selectedDeck?.cards.forEach((card) => {
      selectedDeckStrings.push(card);
    });
    currentMatch.myFullDeck = selectedDeckStrings;
    currentMatch.humanname = selectedDeck ? selectedDeck.name : '';
    // console.log(currentMatch);
    drawDeck();
    updateOppDeck([]);
  });

  onMessageFromIpcMain('match-set-player', (playerCreation) => {
    if (playerCreation.accountId === currentMatch.ourUid) {
      currentMatch.myEntityId = playerCreation.entityId;
    } else {
      currentMatch.oppEntityId = playerCreation.entityId;
      currentMatch.oppCardBack = playerCreation.CardBackDefId;
    }
    const owner = playerCreation.entityId === currentMatch.myEntityId ? 'me' : 'opponent';

    currentMatch.zones[playerCreation.deckEntityId] = {
      type: 'deckEntity',
      owner,
    };
    currentMatch.zones[playerCreation.graveyardEntityId] = {
      type: 'graveyardEntity',
      owner,
    };
    currentMatch.zones[playerCreation.handEntityId] = {
      type: 'handEntity',
      owner,
    };
    updateOppDeck([]);
    //console.log('match-set-player', playerCreation);
  });

  onMessageFromIpcMain('match-set-location', (locationData) => {
    currentMatch.zones[locationData.entityId] = {
      type: 'locationEntity',
      owner: 'location',
      locationSlot: locationData.locationSlot !== undefined ? locationData.locationSlot : 0,
    };
    // console.log('match-set-location', currentMatch);
  });

  onMessageFromIpcMain('match-create-card-entity', (newCardEntity) => {
    currentMatch.cardEntityIDs[newCardEntity.entityId] = {
      cardDefId: '',
      rarityDefId: '',
      entityId: newCardEntity.entityId,
      ownerEntityId: newCardEntity.ownerEntityId,
      zoneId: newCardEntity.zoneEntityId,
      artVariantDefId: '',
    };
    //console.log(newCardEntity);
    // console.log('match-create-card-entity', currentMatch);
  });

  onMessageFromIpcMain('got-suggestions', (suggestions) => {
    //console.log(suggestions);
    if (currentMatch.opponentNick !== '' && !overlayConfig.ovlSettings?.hidesuggestions) {
      currentMatch.oppDeckSuggestions = suggestions.deck;
      currentMatch.oppDeckATSuggestion = suggestions.name;
      updateOppDeck([]);
    }
  });

  onMessageFromIpcMain('match-card-reveal', (revealedCard) => {
    if (currentMatch.TurnNumber === 0) {
      updateOppDeck([]);
      currentMatch.TurnNumber = 1;
    }
    currentMatch.cardEntityIDs[revealedCard.entityId].cardDefId = revealedCard.cardDefId;
    currentMatch.cardEntityIDs[revealedCard.entityId].rarityDefId = revealedCard.rarityDefId;
    currentMatch.cardEntityIDs[revealedCard.entityId].artVariantDefId = revealedCard.artVariantDefId;
    if (currentMatch.cardEntityIDs[revealedCard.entityId].ownerEntityId === currentMatch.myEntityId) {
      if (!overlayConfig.ovlSettings?.hidemy) {
        updateDeck([revealedCard.cardDefId]);
      }
    } else {
      if (!overlayConfig.ovlSettings?.hideopp) {
        updateOppDeck([revealedCard.cardDefId]);
        if (!overlayConfig.ovlSettings?.hidesuggestions) {
          const oppDeckStrings: string[] = [];
          currentMatch.oppDeckStable.forEach((card) => {
            oppDeckStrings.push(card.CardDefId);
          });
          sendMessageToIpcMain('get-suggestions', oppDeckStrings);
        }
      }
    }
    //console.log('match-card-reveal', revealedCard);
  });

  onMessageFromIpcMain('match-card-move', (moveCard) => {
    if (currentMatch.TurnNumber === 0) {
      updateOppDeck([]);
      currentMatch.TurnNumber = 1;
    }
    currentMatch.cardEntityIDs[moveCard.cardEntityId].zoneId = moveCard.targetZoneEntityId;
    currentMatch.cardEntityIDs[moveCard.cardEntityId].ownerEntityId = moveCard.cardOwnerEntityId;
    //console.log('match-card-move', currentMatch.cardEntityIDs);
  });

  onMessageFromIpcMain('decks-message', (decks) => {
    playerDecks.splice(0, playerDecks.length);
    decks.forEach((deck) => {
      playerDecks.push(deck);
    });
    //  console.log('decks-message', playerDecks);
  });

  onMessageFromIpcMain('stats-update', (statUpdate) => {
    //console.log(JSON.stringify(currentMatch));
    currentMatch.over(true);
    updateOppDeck([]);
    overlayElements.OpponentOutFrame.classList.add('hidden');
    drawSession(statUpdate);
    //console.log(statUpdate);
  });

  onMessageFromIpcMain('toggle-me', () => {
    const hideActive = overlayConfig.ovlSettings?.hidemy ? false : true;
    sendMessageToIpcMain('set-setting-o-hidemy', hideActive);
    if (!hideActive) {
      overlayElements.MainDeckFrame.classList.remove('hidden');
    } else {
      overlayElements.MainDeckFrame.classList.add('hidden');
    }
    // toggleButtonClass(overlayElements.ToggleMe, overlayElements.MainDeckFrame.classList.contains('hidden'));
  });

  onMessageFromIpcMain('toggle-opp', () => {
    const hideActive = overlayConfig.ovlSettings?.hideopp ? false : true;
    sendMessageToIpcMain('set-setting-o-hideopp', hideActive);
    if (!hideActive) {
      overlayElements.OpponentOutFrame.classList.remove('hidden');
    } else {
      overlayElements.OpponentOutFrame.classList.add('hidden');
    }
    //toggleButtonClass(overlayElements.ToggleOpp, overlayElements.OpponentOutFrame.classList.contains('hidden'));
  });

  onMessageFromIpcMain('scale-up', () => {
    overlayConfig.currentScale += scaleIncrement;
    scalesetter(true);
  });
  onMessageFromIpcMain('scale-down', () => {
    overlayConfig.currentScale -= scaleIncrement;
    scalesetter(true);
  });
  onMessageFromIpcMain('opacity-up', () => {
    if (overlayConfig.currentOpacity < 1) {
      overlayConfig.currentOpacity += opacityIncrement;
      opacitySetter(true);
    }
  });
  onMessageFromIpcMain('opacity-down', () => {
    const minOpacity = 0.3;
    if (overlayConfig.currentOpacity > minOpacity) {
      overlayConfig.currentOpacity -= opacityIncrement;
      opacitySetter(true);
    }
  });
  onMessageFromIpcMain('need-to-restart-mtga', (state) => {
    if (state) {
      if (overlayElements.RestartWarning.classList.contains('hidden')) {
        overlayElements.RestartWarning.classList.remove('hidden');
      }
    } else {
      if (!overlayElements.RestartWarning.classList.contains('hidden')) {
        overlayElements.RestartWarning.classList.add('hidden');
      }
    }
  });
  onMessageFromIpcMain('cant-inject', (state) => {
    if (overlayElements.AVWarning.classList.contains('hidden')) {
      overlayElements.AVWarning.classList.remove('hidden');
    }
  });

  onMessageFromIpcMain('restart-mtga', () => {
    sendMessageToIpcMain('restart-mtga-now', undefined);
  });
}
