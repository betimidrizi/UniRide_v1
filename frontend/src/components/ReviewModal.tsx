import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

import { Dialog } from '@/components/ui/Dialog';
import { RatingStars } from '@/components/ui/RatingStars';
import { TextArea } from '@/components/ui/TextField';
import { reviewsApi } from '@/api/reviews';
import { extractError } from '@/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  rideId: number;
  targetUserId: number;
  targetUserName: string;
  onSubmitted?: () => void;
}

export function ReviewModal({
  open,
  onClose,
  rideId,
  targetUserId,
  targetUserName,
  onSubmitted
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        rideId,
        targetUserId,
        rating,
        comment: comment.trim() || undefined
      }),
    onSuccess: () => {
      toast.success('Thanks for your review!');
      onSubmitted?.();
      reset();
      onClose();
    },
    onError: (err) => toast.error(extractError(err))
  });

  function reset() {
    setRating(5);
    setComment('');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
      title={`Rate ${targetUserName}`}
      description="Your feedback helps the UniRide community stay safe and friendly."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
        className="space-y-5"
      >
        <div>
          <span className="label">Rating</span>
          <div className="mt-1">
            <RatingStars value={rating} onChange={setRating} size="lg" />
          </div>
        </div>

        <TextArea
          label="Comment (optional)"
          name="comment"
          rows={4}
          maxLength={500}
          placeholder="What was the trip like? Anything other riders should know?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={submit.isPending}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submit.isPending || rating < 1}>
            <Send className="size-4" />
            Submit review
          </button>
        </div>
      </form>
    </Dialog>
  );
}
