// Ukrainian word endings for a person. The gender is known only if they said so (M04b for the signed-in user);
// without it every form keeps the «(а)» hedge it had before.
// `v`  — past tense: «перегляну{v}» → переглянув / переглянула / переглянув(ла)
// `a`  — adjective: «сам{a}» → сам / сама / сам(а)
// `ov` — «прийш{ov}» → прийшов / прийшла / прийшов(ла)
export function genderForms(gender?: 'f' | 'm') {
  const pick = (m: string, f: string, hedged: string) => (gender === 'm' ? m : gender === 'f' ? f : hedged);
  return { v: pick('в', 'ла', 'в(ла)'), a: pick('', 'а', '(а)'), ov: pick('ов', 'ла', 'ов(ла)') };
}
