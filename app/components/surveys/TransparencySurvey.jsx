'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import toast from 'react-hot-toast';

export default function TransparencySurvey({ type = 'pre' }) {
  const [score, setScore] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const checkExisting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('transparency_surveys')
          .select('id, pre_score, post_score')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          if (type === 'pre' && data.pre_score) setExisting(data.pre_score);
          if (type === 'post' && data.post_score) setExisting(data.post_score);
        }
      }
    };
    checkExisting();
  }, [type]);

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to submit survey');
      return;
    }
    const updateData = type === 'pre' ? { pre_score: score } : { post_score: score };
    const { error } = await supabase
      .from('transparency_surveys')
      .upsert({ user_id: user.id, user_role: 'student', ...updateData, survey_type: type }, { onConflict: 'user_id' });
    if (error) toast.error('Error submitting survey');
    else {
      toast.success(`Thank you! Your transparency ${type}-survey has been recorded.`);
      setSubmitted(true);
    }
  };

  if (submitted || existing) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
        <p className="text-gray-600">Your response has been recorded.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transparency Survey ({type === 'pre' ? 'Before using SERENA' : 'After using SERENA'})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-gray-600">On a scale of 1–10, how transparent do you believe the CEC Student Council is?</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Not transparent at all (1)</span>
            <span>Completely transparent (10)</span>
          </div>
          <Slider value={[score]} onValueChange={(val) => setScore(val[0])} min={1} max={10} step={1} />
          <div className="text-center font-bold text-2xl">{score}</div>
        </div>
        <Button onClick={handleSubmit} className="w-full">Submit</Button>
      </CardContent>
    </Card>
  );
}