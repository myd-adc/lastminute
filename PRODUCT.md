# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who wants to go out — tonight, this weekend, last minute — and would rather not go alone: students, regulars of a venue, visitors and tourists, in any city. They open LastMinute when they already half-want to go somewhere and the missing piece is company.

Second audience: venues and organisers who post events and want people to actually show up.

## Product Purpose

Event-first social app. You swipe through events of your communities (the whole city is one tab away), mark «I'm going», and only then see who else is going. In the event room you swipe people; after a mutual «Go together» a chat opens and you go together. Success: people go to events they would otherwise skip, with someone they met through the event.

## Positioning

The event comes first, people second. Who is going is hidden until you commit to going yourself, and you are visible only to people going to the same event. It is not a dating feed, not a social network, not a ticket shop.

## Operating Context

- Phone first: at the event everything happens in the app («I'm going», who is nearby, the event album). The web build is the same app and also the demo people open from a QR code; on a laptop people arrive with no context, often from a shared link.
- Sign-in is an email code, no password. A university or company email unlocks closed communities.
- Communities: anyone can start one; members join by email domain or openly. Their events show first in the feed.

## Capabilities and Constraints

- One Expo Router codebase ships iOS, Android and web with the same design language; UI in Ukrainian and English.
- Symmetry: who is going stays locked until the user marks «I'm going».
- Consent: DMs open only after a mutual «Go together»; a one-sided tap is never revealed.
- 24 h: event chats and the album live until the event ends + 24 h; only contacts both sides chose to keep survive.
- Safety: every person card and chat offers report and block; blocked people disappear everywhere.
- Out of scope: likes and followers, exact geolocation, ticket sales.

## Brand Commitments

- Name: LastMinute; wordmark is a lime dot followed by «lastminute» in lowercase.
- Voice: like a friend — informal, «ти» in Ukrainian, short, a little humour. Examples in the app: «Не йди сам», «Дарина дізнається, тільки якщо ти теж натиснеш».
- Do not position the product as "for students" or "for Lviv"; Lviv and UCU are demo data only.

## Evidence on Hand

- No real users, testimonials, partners, press or usage numbers yet. Do not invent any.
- Demo events, people and communities (`src/data/mock.ts`) may be shown as illustrative examples, clearly as product UI, never as metrics.
- Real product screens exist in Figma `Lrh1ztjszMiPRnHucllhNl` (page «v4 · EN», frames M01–M22, W01–W09).

## Product Principles

1. Show the event before the people; never reveal anyone before the user commits.
2. Consent is mutual or it did not happen.
3. Nothing to perform: no likes, followers, streaks or public counts of you.
4. Ephemeral by default; keeping a contact is a choice both make.
5. Speak like a friend inviting you out, not like a platform selling engagement.
