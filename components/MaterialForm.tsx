// components/MaterialForm.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import RadioGroup from '@/components/RadioGroup';
import InputSingle from '@/components/InputSingle';
import { db } from '@/lib/firebase';
import type { UnitType } from '@/components/StudyMaterialCard';
import clsx from 'clsx';
import * as React from 'react'; 
dayjs.extend(isSameOrBefore);

interface FormValues {
  title: string;
  unitType: UnitType;
  totalCount: number;
  startDate: string;
  deadline: string;
  dailyPlan: number;
}

interface Props {
  uid: string;
  onSaved: () => void;   // 保存後に呼ばれる
}

export default function MaterialForm({ uid, onSaved }: Props) {
  /* ------------- フォーム ---------------- */
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isValid, errors },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      unitType: 'pages',
      totalCount: 0,
      startDate: dayjs().format('YYYY-MM-DD'),
      deadline: '',
      dailyPlan: 0,
    },
  });

  // 自動計算
  const totalCount = watch('totalCount');
  const startDate  = watch('startDate');
  const deadline   = watch('deadline');

  React.useEffect(() => {
    if (!totalCount || !startDate || !deadline) {
      setValue('dailyPlan', 0);
      return;
    }
    const days =
      dayjs(deadline).startOf('day').diff(dayjs(startDate).startOf('day'), 'day') + 1;
    setValue('dailyPlan', days > 0 ? Math.ceil(totalCount / days) : 0);
  }, [totalCount, startDate, deadline, setValue]);

  /* ------------- 送信 ---------------- */
  const onSubmit = async (data: FormValues) => {
    // materials 保存
    const ref = await addDoc(collection(db, 'users', uid, 'materials'), {
      ...data,
      createdAt: serverTimestamp(),
    });

    // 今日の todos/items へコピー
    const todayKey = dayjs().format('YYYYMMDD');
    await setDoc(
      doc(db, 'users', uid, 'todos', todayKey, 'items', ref.id),
      {
        title: data.title,
        unitType: data.unitType,
        planCount: data.dailyPlan,
        done: 0,
      },
      { merge: true },
    );

    reset();
    onSaved();
  };

  /* ------------- UI ---------------- */
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="space-y-6 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* --- 参考書名 --- */}
          <div className="space-y-1">
            <Label htmlFor="title">参考書名</Label>
            <Input id="title" {...register('title', { required: true })} />
          </div>

          {/* --- 単位 --- */}
          <div className="space-y-1">
            <Label>単位</Label>
            <Controller
              control={control}
              name="unitType"
              render={({ field }) => (
                <RadioGroup
                  options={[
                    { label: 'ページ', value: 'pages' },
                    { label: '問題',  value: 'problems' },
                  ]}
                  {...field}
                />
              )}
            />
          </div>

          {/* --- 総数 & １日あたり --- */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>
                総{watch('unitType') === 'pages' ? 'ページ' : '問題'}数
              </Label>
              <Controller
                control={control}
                name="totalCount"
                rules={{ min: 1 }}
                render={({ field }) => (
                  <InputSingle {...field} className="w-full" />
                )}
              />
            </div>

            <div className="space-y-1">
              {/* 見出し横並び */}
              <div className="flex items-center gap-2">
                <Label className="m-0">1日あたり</Label>
                <span className="text-xs text-gray-500">自動計算</span>
              </div>

              {/* 値ボックス */}
              <p
                className={clsx(
                  'flex h-[38px] items-center rounded-md bg-gray-50 px-3',
                  watch('dailyPlan') ? 'text-gray-900' : 'text-gray-400',
                )}
              >
                {watch('dailyPlan') || 0}
              </p>
            </div>
          </div>

          {/* --- 開始日 & 目標達成日 --- */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 開始 */}
            <div className="space-y-1">
              <Label htmlFor="start">開始日</Label>
              <Input
                id="start"
                type="date"
                {...register('startDate', {
                  required: true,
                  validate: (v) =>
                    dayjs(v).isSameOrBefore(dayjs(deadline), 'day') ||
                    '開始日は目標達成日以前にしてください',
                })}
              />
            </div>

            {/* 目標 */}
            <div className="space-y-1">
              <Label htmlFor="deadline">目標達成日</Label>
              <Input
                id="deadline"
                type="date"
                {...register('deadline', {
                  required: true,
                  validate: (v) =>
                    dayjs(startDate).isSameOrBefore(dayjs(v), 'day') ||
                    '開始日よりあとの日付を選択してください',
                })}
              />
              {errors.deadline && (
                <span className="text-xs text-red-500">
                  {errors.deadline.message as string}
                </span>
              )}
            </div>
          </div>

          {/* --- 保存ボタン --- */}
          <Button
            type="submit"
            disabled={!isValid || watch('dailyPlan') === 0}
            className="w-full"
          >
            保存
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
