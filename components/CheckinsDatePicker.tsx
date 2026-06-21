'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function CheckinsDatePicker({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <input
      type="date"
      defaultValue={defaultValue}
      className="form-input"
      style={{ width: 'auto' }}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('data', e.target.value);
        router.push(`?${params.toString()}`);
      }}
    />
  );
}
