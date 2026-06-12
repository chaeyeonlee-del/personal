type GlassTone = 'regular' | 'strong' | 'soft';

type GlassPlatform = 'android' | 'ios' | 'macos' | 'native' | 'web' | 'windows';

type GlassSurface = {
  backdropFilter?: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
};

const glassToneValues: Record<GlassTone, Pick<GlassSurface, 'backgroundColor' | 'borderColor' | 'shadowOpacity'>> = {
  regular: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.32)',
    shadowOpacity: 0.18,
  },
  strong: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderColor: 'rgba(255,255,255,0.42)',
    shadowOpacity: 0.22,
  },
  soft: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
    shadowOpacity: 0.14,
  },
};

export function createGlassSurface(tone: GlassTone = 'regular', platform: GlassPlatform = 'native'): GlassSurface {
  const values = glassToneValues[tone];

  return {
    ...values,
    borderWidth: 1,
    shadowColor: '#0B151B',
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: tone === 'strong' ? 32 : 26,
    ...(platform === 'web' ? { backdropFilter: 'blur(22px) saturate(1.35)' } : null),
  };
}
