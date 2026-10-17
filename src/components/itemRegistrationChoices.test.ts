import { describe, expect, it } from 'vitest';

import type { LabelOption } from '../types';
import { nextFormSelection, nextStorageSelection } from './itemRegistrationChoices';

const forms = [
  option('whole', 'form.whole'),
  option('cut', 'form.cut'),
  option('shredded', 'form.shredded'),
  option('cooked', 'form.cooked'),
  option('raw', 'form.raw'),
  option('shell', 'form.inShell'),
  option('peeled', 'form.peeled'),
  option('opened', 'form.opened'),
  option('unopened', 'form.unopened'),
  option('other', 'form.other'),
];

describe('item registration choices', () => {
  it.each([
    ['whole', 'cut'],
    ['cut', 'shredded'],
    ['cooked', 'raw'],
    ['shell', 'peeled'],
    ['opened', 'unopened'],
  ])('replaces the contradictory %s choice with %s', (first, second) => {
    expect(nextFormSelection([first], find(second), forms, false)).toEqual([second]);
  });

  it('keeps compatible preparation details together in catalog mode', () => {
    expect(nextFormSelection(['cut'], find('cooked'), forms, false)).toEqual(['cut', 'cooked']);
  });

  it('treats Other as exclusive with named preparation choices', () => {
    expect(nextFormSelection(['cut', 'cooked'], find('other'), forms, false)).toEqual(['other']);
    expect(nextFormSelection(['other'], find('cut'), forms, false)).toEqual(['cut']);
  });

  it('keeps exactly one form and one storage choice in label mode', () => {
    expect(nextFormSelection(['cut'], find('cooked'), forms, true)).toEqual(['cooked']);
    expect(nextStorageSelection(['refrigerated'], 'frozen', true)).toEqual(['frozen']);
  });
});

function find(id: string): LabelOption {
  const found = forms.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing test option: ${id}`);
  return found;
}

function option(id: string, translationKey: string): LabelOption {
  return {
    id,
    kind: 'form',
    translationKey,
    customLabel: null,
    legacyValue: id,
    sortOrder: 0,
    appliesToAll: false,
  };
}
