import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Flag, GraduationCap, MapPin, Repeat, Route, Sparkles, Users, Euro, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { TextField } from '@/components/ui/TextField';
import { ridesApi } from '@/api/rides';
import { extractError } from '@/api/client';

/** Combine a YYYY-MM-DD string + an HH:mm string into an ISO datetime string. */
function combineDateTime(dateStr: string, timeStr: string): string {
  // Build a local Date then convert to ISO so the server receives UTC.
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0).toISOString();
}

/** "HH:mm" today, useful as a sensible default for the time pickers. */
function todayPlus(minutes: number): string {
  const d = new Date(Date.now() + minutes * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CreateRidePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [departure, setDeparture] = useState(todayPlus(60));
  const [arrival, setArrival] = useState(todayPlus(120));
  const [isRecurring, setIsRecurring] = useState(false);

  const mutation = useMutation({
    mutationFn: ridesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rides'] });
      qc.invalidateQueries({ queryKey: ['my-rides'] });
      toast.success('Ride is live - passengers can now reserve a seat.');
      navigate('/my-rides');
    },
    onError: (err) => toast.error(extractError(err))
  });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const f = new FormData(e.currentTarget);
    const date = String(f.get('rideDate') ?? '');
    try {
      await mutation.mutateAsync({
        startLocation: String(f.get('startLocation') ?? '').trim(),
        destination: String(f.get('destination') ?? '').trim(),
        departureTime: combineDateTime(date, departure),
        expectedArrivalTime: combineDateTime(date, arrival),
        availableSeats: Number(f.get('availableSeats')),
        price: Number(f.get('price')),
        university: String(f.get('university') ?? '').trim(),
        distanceKm: Number(f.get('distanceKm')),
        isRecurring,
        recurrenceCount: isRecurring ? Number(f.get('recurrenceCount')) : 1,
        recurrenceIntervalDays: isRecurring ? Number(f.get('recurrenceIntervalDays')) : 7
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Helpful preview of duration delta between the two times.
  const duration = (() => {
    if (!departure || !arrival) return null;
    const [dh, dm] = departure.split(':').map(Number);
    const [ah, am] = arrival.split(':').map(Number);
    const minutes = ah * 60 + am - (dh * 60 + dm);
    if (Number.isNaN(minutes) || minutes <= 0) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  return (
    <>
      <PageHeader
        eyebrow="Offer"
        title="Create a ride"
        subtitle="Fill the empty seats."
        description="Set your route, the day, and the time you leave + when you expect to arrive on campus. Passengers can find and reserve a seat immediately."
      />

      <form onSubmit={submit} className="glass p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        <TextField
          name="startLocation"
          label="From"
          placeholder="Skopje city center"
          icon={<MapPin className="size-4" />}
          required
        />
        <TextField
          name="destination"
          label="To (university / campus)"
          placeholder="SEEU campus"
          icon={<Flag className="size-4" />}
          required
        />

        <div className="md:col-span-2">
          <p className="label">When you're driving</p>
          <div className="glass p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_1fr] gap-3 items-end">
            <TextField
              name="rideDate"
              type="date"
              label="Date"
              icon={<Calendar className="size-4" />}
              defaultValue={todayDate()}
              required
            />
            <TextField
              name="departureTime"
              type="time"
              label="Departure time"
              icon={<Clock className="size-4" />}
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              required
            />
            <div className="hidden md:flex h-[44px] items-center justify-center text-slate-400 pb-1">
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="size-5" />
              </motion.div>
            </div>
            <TextField
              name="expectedArrivalTime"
              type="time"
              label="Expected arrival"
              icon={<Clock className="size-4" />}
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              required
            />
          </div>
          {duration && (
            <p className="mt-2 text-xs text-slate-400">
              Estimated trip duration: <span className="text-brand-300 font-medium">{duration}</span>
            </p>
          )}
        </div>

        <TextField
          name="university"
          label="University"
          placeholder="SEEU"
          icon={<GraduationCap className="size-4" />}
          required
        />
        <TextField
          name="availableSeats"
          type="number"
          min={1}
          max={8}
          label="Seats"
          placeholder="3"
          icon={<Users className="size-4" />}
          required
        />
        <TextField
          name="price"
          type="number"
          min={0}
          step="0.01"
          label="Price per seat (EUR)"
          placeholder="5.00"
          icon={<Euro className="size-4" />}
          required
        />
        <TextField
          name="distanceKm"
          type="number"
          min={0}
          step="0.1"
          label="Distance (km)"
          placeholder="40"
          icon={<Route className="size-4" />}
          required
        />

        <div className="md:col-span-2 glass p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="accent-fuchsia-500"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span className="grid place-items-center size-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300">
              <Repeat className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">Repeat this ride</span>
              <span className="block text-xs text-slate-400">Optional: create weekly or custom recurring copies.</span>
            </span>
          </label>
          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <TextField
                name="recurrenceCount"
                type="number"
                min={2}
                max={12}
                label="Number of rides"
                defaultValue={4}
                required
              />
              <TextField
                name="recurrenceIntervalDays"
                type="number"
                min={1}
                max={30}
                label="Repeat every days"
                defaultValue={7}
                required
              />
            </div>
          )}
        </div>

        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn-primary" disabled={submitting || mutation.isPending}>
            <Sparkles className="size-4" />
            Publish ride
          </button>
        </div>
      </form>
    </>
  );
}
