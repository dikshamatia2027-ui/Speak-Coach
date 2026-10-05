/** Curated GRE-level word bank. Tier 1 = advanced, 2 = GRE core, 3 = expert. */
export type Tier = 1 | 2 | 3;
export type Word = {
  id: string;
  word: string;
  ipa: string;
  pos: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  example: string;
  tier: Tier;
};

const w = (
  tier: Tier,
  word: string,
  ipa: string,
  pos: string,
  definition: string,
  synonyms: string[],
  antonyms: string[],
  example: string,
): Word => ({ id: word.toLowerCase(), word, ipa, pos, definition, synonyms, antonyms, example, tier });

export const WORDS: Word[] = [
  w(1, "Candid", "/ˈkæn.dɪd/", "adjective", "Truthful and straightforward; frank.", ["frank", "forthright", "open"], ["evasive", "guarded"], "She gave a candid assessment of why the launch slipped."),
  w(1, "Meticulous", "/məˈtɪk.jə.ləs/", "adjective", "Showing great attention to detail; very careful and precise.", ["thorough", "painstaking", "scrupulous"], ["careless", "sloppy"], "His meticulous notes made the handover effortless."),
  w(1, "Pragmatic", "/præɡˈmæt.ɪk/", "adjective", "Dealing with things sensibly and realistically.", ["practical", "realistic", "sensible"], ["idealistic", "impractical"], "We took a pragmatic approach and shipped the smaller version first."),
  w(1, "Ambivalent", "/æmˈbɪv.ə.lənt/", "adjective", "Having mixed or contradictory feelings about something.", ["conflicted", "torn", "uncertain"], ["decisive", "certain"], "I'm ambivalent about the move — the role is great, but the city isn't."),
  w(1, "Concise", "/kənˈsaɪs/", "adjective", "Giving a lot of information clearly in few words.", ["succinct", "brief", "pithy"], ["verbose", "rambling"], "Keep your answer concise: one point, one example, one result."),
  w(1, "Mitigate", "/ˈmɪt.ɪ.ɡeɪt/", "verb", "To make something less severe, serious, or painful.", ["alleviate", "lessen", "ease"], ["aggravate", "intensify"], "We added a fallback server to mitigate the risk of downtime."),
  w(1, "Resilient", "/rɪˈzɪl.i.ənt/", "adjective", "Able to recover quickly from difficulties.", ["tough", "adaptable", "hardy"], ["fragile", "brittle"], "The team proved resilient after losing its biggest client."),
  w(1, "Advocate", "/ˈæd.və.keɪt/", "verb", "To publicly recommend or support.", ["champion", "endorse", "promote"], ["oppose", "criticize"], "She advocated for a four-day week during the review."),
  w(1, "Scrutinize", "/ˈskruː.tɪ.naɪz/", "verb", "To examine or inspect closely and thoroughly.", ["examine", "inspect", "analyze"], ["skim", "overlook"], "Investors will scrutinize every number in this deck."),
  w(1, "Coherent", "/koʊˈhɪr.ənt/", "adjective", "Logical and consistent; forming a unified whole.", ["logical", "lucid", "consistent"], ["muddled", "incoherent"], "Her argument was coherent from the first slide to the last."),
  w(1, "Diligent", "/ˈdɪl.ɪ.dʒənt/", "adjective", "Having or showing care and conscientiousness in one's work.", ["industrious", "assiduous", "conscientious"], ["lazy", "negligent"], "A diligent reviewer caught the error before it went live."),
  w(1, "Nuance", "/ˈnuː.ɑːns/", "noun", "A subtle difference in meaning, expression, or tone.", ["subtlety", "shade", "distinction"], ["obviousness"], "The translation lost the nuance of the original joke."),

  w(2, "Ubiquitous", "/juːˈbɪk.wɪ.təs/", "adjective", "Present, appearing, or found everywhere.", ["omnipresent", "pervasive", "universal"], ["rare", "scarce"], "Smartphones became ubiquitous within a single decade."),
  w(2, "Ephemeral", "/ɪˈfem.ər.əl/", "adjective", "Lasting for a very short time.", ["fleeting", "transient", "momentary"], ["enduring", "permanent"], "Viral fame is ephemeral; reputation takes years."),
  w(2, "Laconic", "/ləˈkɑː.nɪk/", "adjective", "Using very few words.", ["terse", "curt", "taciturn"], ["verbose", "loquacious"], "His laconic reply — \"Fine.\" — told me he wasn't fine."),
  w(2, "Equivocate", "/ɪˈkwɪv.ə.keɪt/", "verb", "To use ambiguous language to conceal the truth or avoid committing oneself.", ["hedge", "prevaricate", "waffle"], ["clarify", "commit"], "When asked about layoffs, the CEO equivocated for five minutes."),
  w(2, "Obdurate", "/ˈɑːb.dʊr.ət/", "adjective", "Stubbornly refusing to change one's opinion or course of action.", ["intransigent", "obstinate", "unyielding"], ["flexible", "amenable"], "The landlord remained obdurate despite our reasonable offer."),
  w(2, "Prosaic", "/proʊˈzeɪ.ɪk/", "adjective", "Lacking imagination or excitement; dull and ordinary.", ["mundane", "pedestrian", "humdrum"], ["imaginative", "inspired"], "The explanation for the outage was disappointingly prosaic: an expired certificate."),
  w(2, "Assuage", "/əˈsweɪdʒ/", "verb", "To make an unpleasant feeling less intense.", ["soothe", "allay", "relieve"], ["exacerbate", "inflame"], "A quick call from the founder assuaged the client's concerns."),
  w(2, "Cogent", "/ˈkoʊ.dʒənt/", "adjective", "Clear, logical, and convincing.", ["compelling", "persuasive", "forceful"], ["weak", "unconvincing"], "She made a cogent case for doubling the budget."),
  w(2, "Garrulous", "/ˈɡer.ə.ləs/", "adjective", "Excessively talkative, especially on trivial matters.", ["loquacious", "voluble", "chatty"], ["reticent", "taciturn"], "Our garrulous tour guide never let a silence last."),
  w(2, "Exacerbate", "/ɪɡˈzæs.ɚ.beɪt/", "verb", "To make a problem or bad situation worse.", ["aggravate", "worsen", "compound"], ["alleviate", "mitigate"], "Cutting support staff only exacerbated the backlog."),
  w(2, "Pedantic", "/pəˈdæn.tɪk/", "adjective", "Excessively concerned with minor details or rules.", ["nitpicking", "fussy", "hair-splitting"], ["flexible", "easygoing"], "It sounds pedantic, but the comma changes the contract's meaning."),
  w(2, "Lucid", "/ˈluː.sɪd/", "adjective", "Expressed clearly; easy to understand.", ["clear", "articulate", "transparent"], ["confusing", "opaque"], "Even complex ideas sound lucid when she explains them."),

  w(3, "Obsequious", "/əbˈsiː.kwi.əs/", "adjective", "Excessively eager to please or obey.", ["sycophantic", "fawning", "servile"], ["assertive", "domineering"], "The obsequious assistant agreed with every word the director said."),
  w(3, "Perfunctory", "/pɚˈfʌŋk.tɚ.i/", "adjective", "Carried out with minimal effort or reflection.", ["cursory", "token", "superficial"], ["thorough", "careful"], "He gave the contract a perfunctory glance and signed it."),
  w(3, "Recalcitrant", "/rɪˈkæl.sɪ.trənt/", "adjective", "Having an uncooperative attitude toward authority or discipline.", ["defiant", "unruly", "intractable"], ["compliant", "docile"], "Even the most recalcitrant board members came around after the data."),
  w(3, "Sanguine", "/ˈsæŋ.ɡwɪn/", "adjective", "Optimistic, especially in a difficult situation.", ["hopeful", "buoyant", "upbeat"], ["pessimistic", "gloomy"], "Analysts remain sanguine about recovery next quarter."),
  w(3, "Pusillanimous", "/ˌpjuː.sɪˈlæn.ɪ.məs/", "adjective", "Showing a lack of courage or determination; timid.", ["cowardly", "fainthearted", "timorous"], ["bold", "valiant"], "The committee's pusillanimous response satisfied no one."),
  w(3, "Inveterate", "/ɪnˈvet.ɚ.ət/", "adjective", "Having a long-standing habit unlikely to change.", ["habitual", "confirmed", "chronic"], ["occasional", "reformed"], "As an inveterate planner, she had three backup routes."),
  w(3, "Prevaricate", "/prɪˈver.ɪ.keɪt/", "verb", "To speak or act evasively; to avoid telling the whole truth.", ["equivocate", "dodge", "hedge"], ["confess", "level"], "Stop prevaricating and tell me whether the deadline is realistic."),
  w(3, "Iconoclast", "/aɪˈkɑː.nə.klæst/", "noun", "A person who attacks cherished beliefs or institutions.", ["rebel", "dissenter", "maverick"], ["conformist", "traditionalist"], "An iconoclast in her field, she rejected the standard model outright."),
  w(3, "Inimical", "/ɪˈnɪm.ɪ.kəl/", "adjective", "Tending to obstruct or harm; hostile.", ["harmful", "adverse", "detrimental"], ["beneficial", "favorable"], "Constant interruptions are inimical to deep work."),
  w(3, "Loquacious", "/loʊˈkweɪ.ʃəs/", "adjective", "Tending to talk a great deal.", ["talkative", "garrulous", "voluble"], ["taciturn", "reticent"], "After two coffees, even our quietest engineer turns loquacious."),
  w(3, "Quixotic", "/kwɪkˈsɑː.t̬ɪk/", "adjective", "Exceedingly idealistic; unrealistic and impractical.", ["idealistic", "romantic", "starry-eyed"], ["pragmatic", "realistic"], "His quixotic plan to fix the entire industry in a year impressed no one."),
  w(3, "Vituperative", "/vaɪˈtuː.pɚ.ə.t̬ɪv/", "adjective", "Bitter and abusive in language.", ["scathing", "vitriolic", "caustic"], ["complimentary", "laudatory"], "The review was so vituperative that the author stopped reading."),
];

export const wordById = (id: string) => WORDS.find((x) => x.id === id);
