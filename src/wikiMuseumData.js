/**
 * Museum historical collection data loader.
 * Supplies timeline moments and contextual summaries for the 3D museum rooms.
 */

const HISTORICAL_TIMELINE = [
  {
    id: 'orig-1959',
    room: 'origins',
    year: 1959,
    date: 'November 1959',
    title: '1959 Social Revolution',
    body: 'The onset of targeted violence and widespread displacement of the Tutsi population, leading to the first major wave of refugees across East Africa.',
    summary: {
      extract: 'Widespread pogroms forced over 100,000 Tutsis into exile in neighboring Uganda, Burundi, Tanzania, and Zaire.',
      url: 'https://en.wikipedia.org/wiki/Rwandan_Revolution',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'orig-1961',
    room: 'origins',
    year: 1961,
    date: 'September 1961',
    title: 'Abolition of the Monarchy',
    body: 'Referendum abolishes the monarchy under Belgian colonial supervision, institutionalizing ethnic division in governance.',
    summary: {
      extract: 'Colonial authorities oversaw the institutionalization of ethnic quotas and identity cards that formalized systemic discrimination.',
      url: 'https://en.wikipedia.org/wiki/1961_Rwandan_monarchy_referendum',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'orig-1973',
    room: 'origins',
    year: 1973,
    date: 'July 1973',
    title: 'Habyarimana Coup d\'État',
    body: 'Juvénal Habyarimana seizes power following anti-Tutsi purges in schools and universities, consolidating northern political dominance.',
    summary: {
      extract: 'Establishment of the Second Republic and creation of the MRND single-party state with strict quota systems against Tutsis.',
      url: 'https://en.wikipedia.org/wiki/1973_Rwandan_coup_d%27%C3%A9tat',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'prep-1990',
    room: 'preparation',
    year: 1990,
    date: 'October 1990',
    title: 'RPF Incursion & State Retaliation',
    body: 'The Rwandan Patriotic Front launches military operations from Uganda. The regime responds with mass arrests of Tutsi civilians and state-sponsored hate media.',
    summary: {
      extract: 'Thousands of Tutsi civilians across Rwanda were arrested as "accomplices" (ibyitso), accompanied by trial massacres in Kibilira and Bugesera.',
      url: 'https://en.wikipedia.org/wiki/Rwandan_Civil_War',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'prep-1992',
    room: 'preparation',
    year: 1992,
    date: 'March 1992',
    title: 'Bugesera Massacres & CDR Creation',
    body: 'Formation of the extremist Coalition pour la Défense de la République (CDR) and the Interahamwe militia, testing systematic killing mechanisms in Bugesera.',
    summary: {
      extract: 'RTLM radio and Kangura newspaper disseminated virulent anti-Tutsi propaganda, preparing the population for extermination.',
      url: 'https://en.wikipedia.org/wiki/Coalition_for_the_Defence_of_the_Republic',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'prep-1993',
    room: 'preparation',
    year: 1993,
    date: 'August 1993',
    title: 'Arusha Accords Signed',
    body: 'Peace agreement signed between the Government of Rwanda and RPF in Arusha, Tanzania, providing for power-sharing and UNAMIR peacekeepers.',
    summary: {
      extract: 'Extremist elements within the regime, dubbed "Hutu Power", actively prepared to derail the accords through armed militias and weapon imports.',
      url: 'https://en.wikipedia.org/wiki/Arusha_Accords_(Rwanda)',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'hd-1994-04-06',
    room: 'hundredDays',
    year: 1994,
    date: 'April 6, 1994',
    title: 'Plane Downed — The Signal',
    body: 'The aircraft carrying President Habyarimana is shot down near Kigali. Roadblocks are erected immediately, and systematic killings begin within hours.',
    summary: {
      extract: 'Prime Minister Agathe Uwilingiyimana, political moderates, and 10 Belgian UNAMIR peacekeepers were assassinated in the first 24 hours.',
      url: 'https://en.wikipedia.org/wiki/Assassination_of_Juv%C3%A9nal_Habyarimana_and_Cyprien_Ntaryamira',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'hd-1994-04-15',
    room: 'hundredDays',
    year: 1994,
    date: 'April 15–16, 1994',
    title: 'Ntarama & Nyarubuye Church Massacres',
    body: 'Churches and stadiums where tens of thousands sought sanctuary are attacked with grenades, guns, and machetes across Bugesera and Kibungo.',
    summary: {
      extract: 'Over 5,000 people were killed at Ntarama Church and over 20,000 at Nyarubuye, turning holy sanctuaries into mass graves.',
      url: 'https://en.wikipedia.org/wiki/Ntarama_Massacre',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'hd-1994-05-13',
    room: 'hundredDays',
    year: 1994,
    date: 'May 13, 1994',
    title: 'Bisesero Resistance',
    body: 'Tutsis in the Bisesero hills mount organized resistance against militia and army forces with stones and spears for over two months.',
    summary: {
      extract: 'Led by Aminadabu Birara, over 50,000 people defended themselves on the hilltops before overwhelming military forces broke the resistance.',
      url: 'https://en.wikipedia.org/wiki/Bisesero',
      source: 'Memorial Historical Archive',
    },
  },
  {
    id: 'hd-1994-07-04',
    room: 'hundredDays',
    year: 1994,
    date: 'July 4, 1994',
    title: 'Liberation of Kigali',
    body: 'The Rwandan Patriotic Army takes control of Kigali, halting the genocide and establishing order as interim government forces flee.',
    summary: {
      extract: 'July 4 is commemorated as Liberation Day (Kwibohora) in Rwanda, marking the end of 100 days of genocide.',
      url: 'https://en.wikipedia.org/wiki/Rwandan_Civil_War#RPF_offensive',
      source: 'Memorial Historical Archive',
    },
  },
];

export async function loadMuseumCollection() {
  return {
    topics: [],
    timeline: HISTORICAL_TIMELINE,
  };
}
