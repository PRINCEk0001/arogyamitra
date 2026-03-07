export const calculateHealthStats = (profile: {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: string;
}) => {
  const heightM = profile.height / 100;
  const bmi = profile.weight / (heightM * heightM);

  // BMR (Mifflin-St Jeor Equation)
  let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
  bmr = profile.gender === 'male' ? bmr + 5 : bmr - 161;

  const activityFactors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityFactors[profile.activityLevel] || 1.2);

  let category = "Normal";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi >= 25 && bmi < 30) category = "Overweight";
  else if (bmi >= 30) category = "Obese";

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    category
  };
};
