import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LayoverCity } from '@/components/catalog/LayoverCity';

const render = (airport: string) => renderToStaticMarkup(<LayoverCity airport={airport} />);

describe('LayoverCity', () => {
  it('shows the city of a stop airport, in any case', () => {
    expect(render('SHJ')).toBe(' (Sharjah)');
    expect(render('dmk')).toBe(' (Bangkok)');
  });

  it('shows nothing for a code the dataset does not know', () => {
    expect(render('LON')).toBe('');
    expect(render('ZZZ')).toBe('');
  });
});
