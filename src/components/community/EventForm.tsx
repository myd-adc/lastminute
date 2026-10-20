import { router } from 'expo-router';
import { ChevronDown, ChevronUp, ImagePlus, Palette } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Field, InputBox, TextField } from '@/components/onboarding/kit';
import { pickableInterests } from '@/components/onboarding/PreferencesForm';
import { Glow, glows } from '@/components/profile/Glow';
import { PageHead } from '@/components/community/PageHead';
import { Button, Chip, Gradient, Screen, Segmented } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import type { InterestId } from '@/data/types';
import { useT } from '@/i18n';
import { useIsWide } from '@/lib/layout';
import { pickPosterImage } from '@/lib/pickSquareImage';
import { at, DAY, dayLabel, HOUR, time } from '@/lib/time';
import { useNow, useStore } from '@/store/AppStore';
import { onest, type, useTheme } from '@/theme';
import { type GradientId, gradientIds } from '@/theme/palette';

const DAYS = 7;
const DURATIONS = [1, 2, 3, 4];
const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

type Props = {
  title: string;
  sub: string;
  // null = a personal event, owned by the person who creates it rather than by a community.
  communityId: string | null;
  defaultGradient: GradientId;
  note?: ReactNode; // shown under the head (the personal-event limit)
  blocked?: boolean;
};

// M21 "New event": one form for a community's event and for a personal one.
// An end past midnight names its day, so "23:30 – 01:30" doesn't read as ending before it starts.
const endLabel = (startsAt: string, endsAt: string, now: number) =>
  new Date(startsAt).toDateString() === new Date(endsAt).toDateString() ? time(endsAt) : `${dayLabel(endsAt, now).toLowerCase()} ${time(endsAt)}`;

export function EventForm({ title: head, sub, communityId, defaultGradient, note, blocked }: Props) {
  const { c } = useTheme();
  const { t } = useT();
  const { addEvent } = useStore();
  const now = useNow();
  const wide = useIsWide();
  const [title, setTitle] = useState('');
  const [words, setWords] = useState('');
  const [gradient, setGradient] = useState<GradientId>(defaultGradient);
  const [posterOpen, setPosterOpen] = useState(false);
  // The card can show the event's own poster photo instead of the generated words-on-colour one.
  const [posterKind, setPosterKind] = useState<'words' | 'photo'>('words');
  const [image, setImage] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [start, setStart] = useState('19:00');
  const [hours, setHours] = useState(2);
  const [whenOpen, setWhenOpen] = useState(false);
  const [where, setWhere] = useState('');
  // No default: the category draws the poster art, and a silent preset put dice on a cinema night.
  const [category, setCategory] = useState<InterestId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startsAt = useMemo(() => {
    const m = start.trim().match(TIME_RE);
    return m ? at(now, day, Number(m[1]), Number(m[2])) : null;
  }, [start, day, now]);
  const endsAt = startsAt ? new Date(Date.parse(startsAt) + hours * HOUR).toISOString() : null;
  const lines = (words.trim() || title.trim()).toUpperCase().split(/\s+/).filter(Boolean).slice(0, 2);
  // "Kabinet anticafe, 24 Sheptytskykh St": the place is everything before the first comma.
  const [venue, ...rest] = where.split(',');
  const address = rest.join(',').trim();
  const past = !!startsAt && Date.parse(startsAt) <= now;
  const valid = title.trim().length >= 2 && venue.trim().length >= 2 && !!startsAt && !past && !!category;
  // Say why "Publish" is dim, next to the field that causes it, instead of leaving the person guessing.
  const timeHint = !!start.trim() && !startsAt ? t('community.event.badTime') : past ? t('community.event.pastTime') : null;
  const needsCategory = !category && title.trim().length >= 2 && venue.trim().length >= 2 && !!startsAt && !past;

  const publish = async () => {
    if (!startsAt || !endsAt) return setError(t('community.event.badTime'));
    if (!valid || !category) return;
    setBusy(true);
    const interest = pickableInterests().find((i) => i.id === category);
    const id = await addEvent({
      communityId,
      title: title.trim(),
      description: '',
      startsAt,
      endsAt,
      venue: venue.trim(),
      address,
      price: null,
      category,
      poster: { lines: lines.length ? lines : ['LAST', 'MINUTE'], emoji: interest?.emoji ?? '', gradient },
      image: posterKind === 'photo' && image ? image : undefined,
    });
    setBusy(false);
    if (!id) return setError(t('community.event.failed'));
    router.replace({ pathname: '/event/[id]', params: { id } });
  };

  return (
    <Screen
      keyboard
      backdrop={!wide && <Glow blobs={glows.community} />}
      contentStyle={wide && styles.wide}
      footer={<Button label={t('community.event.publish')} onPress={publish} disabled={!valid || busy || blocked} loading={busy} />}
    >
      <PageHead title={head} sub={sub} />
      {note}

      <Pressable
        accessibilityRole="button"
        aria-expanded={posterOpen}
        onPress={() => setPosterOpen((v) => !v)}
        style={styles.cover}
      >
        <View>
          {posterKind === 'photo' && image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <Gradient id={gradient} style={styles.avatar}>
              <Text style={[onest('bold', 34), styles.initial]}>{lines[0]?.[0]}</Text>
            </Gradient>
          )}
          <View style={[styles.badge, { backgroundColor: c.accent, borderColor: c.bg }]}>
            <Palette size={14} color={c.onAccent} strokeWidth={2} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[onest('semibold', 15, 19), { color: c.text }]}>{t('community.event.poster')}</Text>
          <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{t('community.event.posterSub')}</Text>
        </View>
      </Pressable>
      {posterOpen && (
        <View style={{ gap: 12 }}>
          <Segmented
            options={[
              { key: 'words', label: t('community.event.posterWordsKind') },
              { key: 'photo', label: t('community.event.posterPhotoKind') },
            ]}
            value={posterKind}
            onChange={setPosterKind}
          />
        </View>
      )}
      {posterOpen && posterKind === 'photo' && (
        <View style={styles.photoRow}>
          {image && <Image source={{ uri: image }} style={styles.photoThumb} resizeMode="cover" />}
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={[onest('regular', 13, 17.5), { color: c.muted }]}>{t('community.event.posterPhotoSub')}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                const uri = await pickPosterImage();
                if (uri) setImage(uri);
              }}
              style={({ pressed }) => [styles.photoBtn, { backgroundColor: c.surface2 }, pressed && { opacity: 0.8 }]}
            >
              <ImagePlus size={18} color={c.text} strokeWidth={2} />
              <Text style={[onest('semibold', 14), { color: c.text }]}>{t(image ? 'community.event.posterPhotoChange' : 'community.event.posterPhotoPick')}</Text>
            </Pressable>
          </View>
        </View>
      )}
      {posterOpen && posterKind === 'words' && (
        <View style={{ gap: 12 }}>
          <TextField
            accessibilityLabel={t('community.event.posterWords')}
            value={words}
            onChangeText={(v) => setWords(v.slice(0, 24))}
            placeholder={t('community.event.posterPlaceholder')}
            autoCapitalize="characters"
            boxStyle={styles.input}
          />
          <View style={styles.chips}>
            {gradientIds.map((g) => (
              <Pressable key={g} accessibilityRole="radio" aria-checked={g === gradient} onPress={() => setGradient(g)} hitSlop={4}>
                <Gradient id={g} style={[styles.swatch, g === gradient && { borderColor: c.text, borderWidth: 2 }]} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <Field label={t('community.event.name')}>
        <TextField
          accessibilityLabel={t('community.event.name')}
          value={title}
          onChangeText={(v) => setTitle(v.slice(0, 80))}
          placeholder={t('community.event.namePlaceholder')}
          boxStyle={styles.input}
        />
      </Field>

      <Field label={t('community.event.day')}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('community.event.day')}
          aria-expanded={whenOpen}
          onPress={() => setWhenOpen((v) => !v)}
        >
          <InputBox focused={whenOpen}>
            <Text style={[onest('medium', 16, 20), { color: startsAt ? c.text : c.muted, flex: 1 }]} numberOfLines={1}>
              {startsAt && endsAt ? `${dayLabel(startsAt, now)} · ${time(startsAt)} – ${endLabel(startsAt, endsAt, now)}` : t('community.event.badTime')}
            </Text>
            {whenOpen ? <ChevronUp size={20} color={c.muted} strokeWidth={2} /> : <ChevronDown size={20} color={c.muted} strokeWidth={2} />}
          </InputBox>
        </Pressable>
      </Field>
      {timeHint && <Text style={[type.footnote, { color: c.danger }]}>{timeHint}</Text>}
      {whenOpen && (
        <View style={{ gap: 12 }}>
          <View style={styles.chips}>
            {Array.from({ length: DAYS }, (_, i) => (
              <Chip key={i} label={dayLabel(new Date(now + i * DAY).toISOString(), now)} selected={day === i} onPress={() => setDay(i)} />
            ))}
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label={t('community.event.start')}>
                <TextField
                  accessibilityLabel={t('community.event.start')}
                  value={start}
                  onChangeText={setStart}
                  placeholder={t('community.event.startPlaceholder')}
                  keyboardType="numbers-and-punctuation"
                  boxStyle={styles.input}
                />
              </Field>
            </View>
            <View style={{ flex: 1.4, gap: 8 }}>
              <Text style={[onest('medium', 13, 17), { color: c.muted }]}>{t('community.event.duration')}</Text>
              <View style={styles.chips}>
                {DURATIONS.map((h) => (
                  <Chip key={h} label={t('community.event.hours', { count: h })} selected={hours === h} onPress={() => setHours(h)} />
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      <Field label={t('community.event.venue')}>
        <TextField
          accessibilityLabel={t('community.event.venue')}
          value={where}
          onChangeText={(v) => setWhere(v.slice(0, 120))}
          placeholder={t('community.event.venuePlaceholder')}
          boxStyle={styles.input}
        />
      </Field>

      <View style={styles.chips}>
        <Text style={[onest('medium', 13, 17), styles.inlineLabel, { color: c.muted }]}>{t('community.event.category')}</Text>
        {pickableInterests().map((i) => (
          <Chip key={i.id} label={`${i.emoji} ${i.label}`} selected={category === i.id} onPress={() => setCategory(i.id)} />
        ))}
      </View>

      {needsCategory && <Text style={[type.footnote, { color: c.muted }]}>{t('community.event.pickCategory')}</Text>}
      {error && <Text style={[type.footnote, { color: c.danger }]}>{error}</Text>}
    </Screen>
  );
}

// M21 geometry: 88 pt poster dot with a 26 pt badge, 54 pt fields, chips wrap with an inline caption.
const styles = StyleSheet.create({
  wide: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  cover: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  photoRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  photoThumb: { width: 84, height: 118, borderRadius: 12 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', height: 40, paddingHorizontal: 14, borderRadius: 20 },
  input: { minHeight: 54 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  inlineLabel: { marginRight: 2 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
