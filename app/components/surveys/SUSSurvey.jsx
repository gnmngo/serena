'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';

const SUS_QUESTIONS = [
  "I think that I would like to use this system frequently.",
  "I found the system unnecessarily complex.",
  "I thought the system was easy to use.",
  "I think that I would need the support of a technical person to be able to use this system.",
  "I found the various functions in this system were well integrated.",
  "I thought there was too much inconsistency in this system.",
  "I would imagine that most people would learn to use this system very quickly.",
  "I found the system very cumbersome to use.",
  "I felt very confident using the system.",
  "I needed to learn a lot of things before I could get going with this system."
];

export default function SUSSurvey() {
  const [responses, setResponses] = useState(Array(10).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  const calculateSUSScore = () => {
    let score = 0;
    for (let i = 0; i < 10; i++) {
      if (responses[i] !== null) {
        if (i % 2 === 0) score += responses[i] - 1;
        else score += 5 - responses[i];
      }
    }
    return score * 2.5;
  };

  const handleSubmit = async () => {
    if (responses.some(r => r === null)) {
      toast.error('Please answer all questions');
      return;
    }
    const susScore = calculateSUSScore();
    const { error } = await supabase.from('usability_surveys').insert({
      q1: responses[0], q2: responses[1], q3: responses[2], q4: responses[3],
      q5: responses[4], q6: responses[5], q7: responses[6], q8: responses[7],
      q9: responses[8], q10: responses[9], sus_score: susScore
    });
    if (error) toast.error('Error submitting survey');
    else {
      toast.success('Thank you for your feedback!');
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
        <p className="text-gray-600">Your feedback helps us improve SERENA.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold">System Usability Scale (SUS)</h1>
      <p className="text-gray-600">Please rate your agreement with each statement (1=Strongly Disagree, 5=Strongly Agree):</p>
      {SUS_QUESTIONS.map((q, idx) => (
        <Card key={idx}>
          <CardHeader><CardTitle className="text-base">{q}</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={responses[idx]?.toString()} onValueChange={(val) => {
              const newResponses = [...responses];
              newResponses[idx] = parseInt(val);
              setResponses(newResponses);
            }} className="flex gap-4">
              {[1,2,3,4,5].map(num => (
                <div key={num} className="flex items-center space-x-2">
                  <RadioGroupItem value={num.toString()} id={`q${idx}-${num}`} />
                  <Label htmlFor={`q${idx}-${num}`}>{num}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSubmit} className="w-full">Submit Survey</Button>
    </div>
  );
}