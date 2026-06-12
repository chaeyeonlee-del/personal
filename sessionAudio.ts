const defaultSoundLabels: Record<string, string> = {
  Rain: 'Rain',
  Water: 'Ocean',
  Ocean: 'Ocean',
  Night: 'Night Forest',
  'Night Forest': 'Night Forest',
};

export function toDefaultSoundLabel(sound: string) {
  return defaultSoundLabels[sound] ?? sound;
}

export function getSoundToggleLabel(sound: string, enabled: boolean) {
  return enabled ? `${toDefaultSoundLabel(sound)} on` : 'Sound off';
}
