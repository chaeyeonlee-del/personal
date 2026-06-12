export type HooCollectionCategory = 'all' | 'sea' | 'forest' | 'sky';

export type HooCollectionCharacter = {
  id: string;
  name: string;
  category: Exclude<HooCollectionCategory, 'all'>;
  imageKey: string;
  emptyImageKey: string;
};

export const HOO_COLLECTION_CATALOG = [
  {
    id: 'collection-01-butterfly',
    name: '나비 후우',
    category: 'sky',
    imageKey: 'hoo-collection-01-butterfly',
    emptyImageKey: 'hoo-collection-empty-01-butterfly',
  },
  {
    id: 'collection-02-sparrow',
    name: '참새 후우',
    category: 'sky',
    imageKey: 'hoo-collection-02-sparrow',
    emptyImageKey: 'hoo-collection-empty-02-sparrow',
  },
  {
    id: 'collection-03-rainbow-jellyfish',
    name: '무지개 후우',
    category: 'sea',
    imageKey: 'hoo-collection-03-rainbow-jellyfish',
    emptyImageKey: 'hoo-collection-empty-03-rainbow-jellyfish',
  },
  {
    id: 'collection-04-ladybug-leaf',
    name: '잎벌레 후우',
    category: 'forest',
    imageKey: 'hoo-collection-04-ladybug-leaf',
    emptyImageKey: 'hoo-collection-empty-04-ladybug-leaf',
  },
  {
    id: 'collection-06-tropical-flower-b',
    name: '꽃잎 후우',
    category: 'forest',
    imageKey: 'hoo-collection-06-tropical-flower-b',
    emptyImageKey: 'hoo-collection-empty-06-tropical-flower-b',
  },
  {
    id: 'collection-07-sunset-seahorse',
    name: '노을 후우',
    category: 'sea',
    imageKey: 'hoo-collection-07-sunset-seahorse',
    emptyImageKey: 'hoo-collection-empty-07-sunset-seahorse',
  },
  {
    id: 'collection-08-blue-snail',
    name: '달팽이 후우',
    category: 'forest',
    imageKey: 'hoo-collection-08-blue-snail',
    emptyImageKey: 'hoo-collection-empty-08-blue-snail',
  },
  {
    id: 'collection-09-peacock-feather',
    name: '깃털 후우',
    category: 'sky',
    imageKey: 'hoo-collection-09-peacock-feather',
    emptyImageKey: 'hoo-collection-empty-09-peacock-feather',
  },
  {
    id: 'collection-10-rainbow-seashell',
    name: '조개 후우',
    category: 'sea',
    imageKey: 'hoo-collection-10-rainbow-seashell',
    emptyImageKey: 'hoo-collection-empty-10-rainbow-seashell',
  },
  {
    id: 'collection-11-sleepy-bluebird',
    name: '파랑새 후우',
    category: 'sky',
    imageKey: 'hoo-collection-11-sleepy-bluebird',
    emptyImageKey: 'hoo-collection-empty-11-sleepy-bluebird',
  },
  {
    id: 'collection-12-strawberry-sprout',
    name: '새싹 후우',
    category: 'forest',
    imageKey: 'hoo-collection-12-strawberry-sprout',
    emptyImageKey: 'hoo-collection-empty-12-strawberry-sprout',
  },
  {
    id: 'collection-13-coral-branch',
    name: '산호 후우',
    category: 'sea',
    imageKey: 'hoo-collection-13-coral-branch',
    emptyImageKey: 'hoo-collection-empty-13-coral-branch',
  },
  {
    id: 'collection-14-dazed-snowflake',
    name: '눈꽃 후우',
    category: 'sky',
    imageKey: 'hoo-collection-14-dazed-snowflake',
    emptyImageKey: 'hoo-collection-empty-14-dazed-snowflake',
  },
  {
    id: 'collection-15-flame-sunset',
    name: '햇살 후우',
    category: 'sky',
    imageKey: 'hoo-collection-15-flame-sunset',
    emptyImageKey: 'hoo-collection-empty-15-flame-sunset',
  },
  {
    id: 'collection-16-extra-colorful',
    name: '빛방울 후우',
    category: 'sea',
    imageKey: 'hoo-collection-16-extra-colorful',
    emptyImageKey: 'hoo-collection-empty-16-extra-colorful',
  },
  {
    id: 'collection-17-sleepy-moon-cloud',
    name: '달구름 후우',
    category: 'sky',
    imageKey: 'hoo-collection-17-sleepy-moon-cloud',
    emptyImageKey: 'hoo-collection-empty-17-sleepy-moon-cloud',
  },
  {
    id: 'collection-18-sea-cucumber',
    name: '바다잠 후우',
    category: 'sea',
    imageKey: 'hoo-collection-18-sea-cucumber',
    emptyImageKey: 'hoo-collection-empty-18-sea-cucumber',
  },
  {
    id: 'collection-19-sleepy-mushroom',
    name: '버섯 후우',
    category: 'forest',
    imageKey: 'hoo-collection-19-sleepy-mushroom',
    emptyImageKey: 'hoo-collection-empty-19-sleepy-mushroom',
  },
  {
    id: 'collection-20-grumpy-kelp',
    name: '다시마 후우',
    category: 'sea',
    imageKey: 'hoo-collection-20-grumpy-kelp',
    emptyImageKey: 'hoo-collection-empty-20-grumpy-kelp',
  },
  {
    id: 'collection-21-goofy-starfish',
    name: '별모래 후우',
    category: 'sea',
    imageKey: 'hoo-collection-21-goofy-starfish',
    emptyImageKey: 'hoo-collection-empty-21-goofy-starfish',
  },
  {
    id: 'collection-22-sleepy-pebbles',
    name: '조약돌 후우',
    category: 'forest',
    imageKey: 'hoo-collection-22-sleepy-pebbles',
    emptyImageKey: 'hoo-collection-empty-22-sleepy-pebbles',
  },
  {
    id: 'collection-23-surprised-raindrop',
    name: '빗방울 후우',
    category: 'sky',
    imageKey: 'hoo-collection-23-surprised-raindrop',
    emptyImageKey: 'hoo-collection-empty-23-surprised-raindrop',
  },
  {
    id: 'collection-24-sleepy-manta-ray',
    name: '가오리 후우',
    category: 'sea',
    imageKey: 'hoo-collection-24-sleepy-manta-ray',
    emptyImageKey: 'hoo-collection-empty-24-sleepy-manta-ray',
  },
  {
    id: 'collection-25-blank-acorn',
    name: '도토리 후우',
    category: 'forest',
    imageKey: 'hoo-collection-25-blank-acorn',
    emptyImageKey: 'hoo-collection-empty-25-blank-acorn',
  },
  {
    id: 'collection-27-dozing-seashell',
    name: '잠조개 후우',
    category: 'sea',
    imageKey: 'hoo-collection-27-dozing-seashell',
    emptyImageKey: 'hoo-collection-empty-27-dozing-seashell',
  },
  {
    id: 'collection-28-windsock-sky',
    name: '바람 후우',
    category: 'sky',
    imageKey: 'hoo-collection-28-windsock-sky',
    emptyImageKey: 'hoo-collection-empty-28-windsock-sky',
  },
  {
    id: 'collection-29-sleepy-lotus',
    name: '연꽃 후우',
    category: 'forest',
    imageKey: 'hoo-collection-29-sleepy-lotus',
    emptyImageKey: 'hoo-collection-empty-29-sleepy-lotus',
  },
  {
    id: 'collection-30-coral-branch-alt',
    name: '물산호 후우',
    category: 'sea',
    imageKey: 'hoo-collection-30-coral-branch-alt',
    emptyImageKey: 'hoo-collection-empty-30-coral-branch-alt',
  },
  {
    id: 'collection-31-sleepy-pinecone',
    name: '솔방울 후우',
    category: 'forest',
    imageKey: 'hoo-collection-31-sleepy-pinecone',
    emptyImageKey: 'hoo-collection-empty-31-sleepy-pinecone',
  },
  {
    id: 'collection-32-dazed-snowflake-alt',
    name: '서리 후우',
    category: 'sky',
    imageKey: 'hoo-collection-32-dazed-snowflake-alt',
    emptyImageKey: 'hoo-collection-empty-32-dazed-snowflake-alt',
  },
] as const satisfies HooCollectionCharacter[];

export const HOO_COLLECTION_TOTAL = HOO_COLLECTION_CATALOG.length;

export function getHooCollectionCharacter(characterId: string) {
  return HOO_COLLECTION_CATALOG.find((character) => character.id === characterId) ?? null;
}

export function getHooCollectionCharactersByCategory(category: HooCollectionCategory) {
  if (category === 'all') {
    return HOO_COLLECTION_CATALOG;
  }

  return HOO_COLLECTION_CATALOG.filter((character) => character.category === category);
}
