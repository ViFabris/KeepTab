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
    expect(nextFormSelection([first], find(second), forms)).toEqual([second]);
  });

  it('combines one choice from each independent category', () => {
    let selected = nextFormSelection([], find('whole'), forms);
    selected = nextFormSelection(selected, find('shell'), forms);
    selected = nextFormSelection(selected, find('unopened'), forms);
    expect(selected).toEqual(['whole', 'shell', 'unopened']);
  });

  it('allows cut and peeled while preventing both skin choices', () => {
    expect(nextFormSelection(['cut'], find('peeled'), forms)).toEqual(['cut', 'peeled']);
    expect(nextFormSelection(['cut', 'peeled'], find('shell'), forms)).toEqual(['cut', 'shell']);
  });

  it('keeps cooking and preparation independent', () => {
    expect(nextFormSelection(['cut'], find('cooked'), forms)).toEqual(['cut', 'cooked']);
    expect(nextFormSelection(['cut', 'cooked'], find('raw'), forms)).toEqual(['cut', 'raw']);
  });

  it('keeps exactly one storage choice in label mode', () => {
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
