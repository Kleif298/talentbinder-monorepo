# Duration Attribute Migration Summary

## Overview
Migrated the Event schema from using `duration` field to explicit `ending_at` timestamps, following the schema definition in `talentBinder_create-schema.sql`.

### Schema Change
- **OLD**: Event_Session stored `starting_at` and `duration`
- **NEW**: Event_Session stores `starting_at` and `ending_at` (both `timestamptz`)

---

## Files Modified

### 1. Frontend Type Definitions
**File**: `frontend/src/types/Event.ts`

**Changes**:
- Event interface: Removed `duration?: string` → Added `endingAt?: string`
- EventForm type: Removed `duration?: string` → Added `endingAt?: string`

### 2. Backend API Routes
**File**: `backend/routes/events.js`

**Changes**:

#### GET /api/events (Line 8-37)
- Changed SELECT from `es.duration` to `es.ending_at as "endingAt"`
- Query now retrieves: `startingAt` and `endingAt` from Event_Session

#### POST /api/events (Line 43-99)
- Changed request body param from `duration` to `endingAt`
- Added validation: Both `startingAt` AND `endingAt` are required
- Creates Event_Session with: `INSERT INTO Event_Session (event_id, starting_at, ending_at)`
- Response includes `endingAt` instead of `duration`

#### PUT /api/events/:eventId (Line 147-197)
- Changed request body param from `duration` to `endingAt`
- Updates Event_Session with both `starting_at` and `ending_at`
- Uses COALESCE to preserve existing values if not provided
- Response includes `endingAt` instead of `duration`

### 3. EventCard Component
**File**: `frontend/src/components/EventCard/EventCard.tsx`

**Changes**:
- Removed: `{event.duration && <div>...` duration display
- Added: `{event.endingAt && <div>...` which shows "Endet" (Ends) with formatted end time
- Time formatting: Uses `toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })`

### 4. EventModal Component
**File**: `frontend/src/components/EventModal/EventModal.tsx`

**Changes**:
- Form state: `duration: ""` → `endingAt: ""`
- Form initialization: Removed `formatDuration()` function
- Added: `formatEndingAt()` function to convert ISO timestamps to datetime-local format
- Conversion on submit: Removed `convertDuration()` function
- Added: `convertEndingAtToISO()` function to convert datetime-local to ISO format
- Form input field: Changed from `<input type="time" name="duration">` to `<input type="datetime-local" name="endingAt">`
- Label changed from "Dauer" (Duration) to "Enddatum & Zeit" (End Date & Time)

### 5. InfoModal Component
**File**: `frontend/src/components/InfoModal/InfoModal.tsx`

**Changes**:
- Removed: Duration display block
- Added: End time display showing `event.endingAt` with full `toLocaleString()` formatting

---

## Database Impact

No schema creation needed - changes align with existing `talentBinder_create-schema.sql`:

```sql
CREATE TABLE Event_Session (
    session_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    starting_at timestamptz NOT NULL,
    ending_at timestamptz NOT NULL,      -- THIS IS NOW USED
    session_location VARCHAR(255),
    ...
);
```

---

## API Contract Changes

### Create Event
**Before**:
```json
{
  "title": "Event Name",
  "startingAt": "2025-11-15T10:00:00Z",
  "duration": "02:00:00"
}
```

**After**:
```json
{
  "title": "Event Name",
  "startingAt": "2025-11-15T10:00:00Z",
  "endingAt": "2025-11-15T12:00:00Z"
}
```

### Update Event
**Before**: Duration parameter accepted
**After**: EndingAt parameter required instead

### List Events Response
**Before**:
```json
{
  "events": [
    {
      "id": 1,
      "startingAt": "2025-11-15T10:00:00Z",
      "duration": "02:00:00"
    }
  ]
}
```

**After**:
```json
{
  "events": [
    {
      "id": 1,
      "startingAt": "2025-11-15T10:00:00Z",
      "endingAt": "2025-11-15T12:00:00Z"
    }
  ]
}
```

---

## Validation & Error Handling

- POST endpoint now validates BOTH `startingAt` and `endingAt`
- Returns 400 error if either is missing: "title, startingAt, and endingAt are required"
- Event_Session creation includes CHECK constraint: `starting_at < ending_at`

---

## Testing Checklist

- [ ] POST /api/events with both startingAt and endingAt
- [ ] POST /api/events without endingAt (should fail with 400)
- [ ] PUT /api/events/:id to update event times
- [ ] GET /api/events returns endingAt for all events
- [ ] EventModal displays datetime-local picker for endingAt
- [ ] EventCard displays "Endet" with proper time formatting
- [ ] InfoModal shows full end date/time
- [ ] Frontend type checking passes (no TypeScript errors)

---

## Migration Notes

- All components now use explicit end times instead of calculating from duration
- Frontend handles ISO timestamp to datetime-local conversion for user input
- Backend always stores and returns ISO timestamps (timestamptz)
- No data loss - duration field is completely replaced by ending_at semantics

