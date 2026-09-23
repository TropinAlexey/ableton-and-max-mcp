# ADR-010: Realtime State via MCP Resources (per-domain)

**Status:** Accepted
**Date:** 2026-09-23

## Context

Клиентам нужен realtime push при изменении состояния Ableton (tempo, mute, позиции клипов и т.д.) без polling тулами. AbletonOSC даёт `start_listen/stop_listen` (~30+ свойств: song, track, clip, device, scene, view). MCP SDK v2 даёт `registerResource()` + `sendResourceUpdated()`.

Рассмотрены 3 гранулярности:
- A: per-domain ресурсы (song/track/clip/device/view/scene)
- B: один агрегированный `ableton://state`
- C: per-property ресурсы

## Decision

Вариант A: 6 ресурсов/шаблонов:
- `ableton://song/state`
- `ableton://track/{index}/state`
- `ableton://clip/{track}/{clip}/position`
- `ableton://device/{track}/{device}/parameters`
- `ableton://view/state`
- `ableton://scene/{index}/state`

Read = подписка (`start_listen`, wildcard `*` где возможно) + best-effort опрос + возврат кэша при offline. Push = unsolicited OSC на том же UDP-сокете -> `AbletonStateManager.handlePush` обновляет кэш и зовёт `sendResourceUpdated({ uri })`.

Song/view подписываются при старте (если Ableton онлайн); track/clip/device/scene — лениво при первом read/subscribe. `beat` исключён из song/state (шумный), включается только через `ensureBeatListening()`.

## Consequences

- Клиент подписывается только на нужное; изменение одного свойства триггерит обновление всего домена (данные компактные).
- Request queue не затронута: push-сообщения при отсутствии pending request идут только в `emit('message')`; при наличии — несут актуальное значение, что корректно.
- Read устойчив к offline: каждый проп через `safeRequest`, частичные данные + кэш.
- Без новых зависимостей, localhost-only, существующие 40 tools не меняются.
