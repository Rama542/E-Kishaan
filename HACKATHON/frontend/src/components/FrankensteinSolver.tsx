import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Brain, Trophy, Play, RotateCcw, Lightbulb, Target } from 'lucide-react';
import { solveFrankensteinProblem, type Solution } from '@/lib/algorithms';
import { useUserStats } from '@/contexts/UserStatsContext';

interface SampleProblem {
  key: 'basic' | 'complex' | 'master';
  recipes: string[];
  target: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const sampleProblems: SampleProblem[] = [
  {
    key: 'basic',
    recipes: ['awakening = snakefangs + wolfbane'],
    target: 'awakening',
    difficulty: 'easy',
  },
  {
    key: 'complex',
    recipes: [
      'strengthening = awakening + moonstone',
      'awakening = snakefangs + wolfbane',
      'healing = moonstone + herbs',
    ],
    target: 'strengthening',
    difficulty: 'medium',
  },
  {
    key: 'master',
    recipes: [
      'elixir = strengthening + healing + wisdom',
      'strengthening = awakening + moonstone',
      'awakening = snakefangs + wolfbane',
      'healing = moonstone + herbs',
      'wisdom = ancient_scroll + meditation_crystal',
      'meditation_crystal = moonstone + starlight',
    ],
    target: 'elixir',
    difficulty: 'hard',
  },
];

export default function FrankensteinSolver() {
  const { t } = useTranslation();
  const { stats, recordProblemSolved } = useUserStats();
  const [recipes, setRecipes] = useState<string>('');
  const [targetPotion, setTargetPotion] = useState<string>('');
  const [solution, setSolution] = useState<Solution | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<SampleProblem | null>(null);
  const [solvedProblems, setSolvedProblems] = useState<string[]>(['basic']);

  const handleSolve = async () => {
    if (!recipes.trim() || !targetPotion.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = solveFrankensteinProblem(recipes, targetPotion);
      setSolution(result);

      if (result.minOrbs > 0) {
        const points = selectedProblem?.difficulty === 'easy' ? 50 :
                       selectedProblem?.difficulty === 'medium' ? 100 :
                       selectedProblem?.difficulty === 'hard' ? 200 : 75;

        recordProblemSolved(points, selectedProblem ? t(`solver.samples.${selectedProblem.key}.title`) : targetPotion);
        if (selectedProblem && !solvedProblems.includes(selectedProblem.key)) {
          setSolvedProblems((prev: string[]) => [...prev, selectedProblem.key]);
        }
      }
    } catch (error) {
      setSolution({
        minOrbs: -1,
        steps: [],
        explanation: { key: 'error', params: { message: 'Unable to solve the problem. Please check your recipe format.' } },
      });
    }

    setIsLoading(false);
  };

  const loadSampleProblem = (problem: SampleProblem) => {
    setSelectedProblem(problem);
    setRecipes(problem.recipes.join('\n'));
    setTargetPotion(problem.target);
    setSolution(null);
  };

  const resetSolver = () => {
    setRecipes('');
    setTargetPotion('');
    setSolution(null);
    setSelectedProblem(null);
  };

  const getDifficultyColor = (difficulty: SampleProblem['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  function renderExplanation(explanation: Solution['explanation']): string {
    const { key, params } = explanation;
    if (key === 'error') return t('solver.explanation.error', params);
    if (key === 'basicIngredient') return t('solver.explanation.basicIngredient', params);

    let text = t('solver.explanation.composedBase', params);
    if (params.hasBasic) text += ' ' + t('solver.explanation.basicNote', params);
    if (params.hasComplex) text += ' ' + t('solver.explanation.complexNote', params);
    text += ' ' + t('solver.explanation.totalNote', params);
    return text;
  }

  return (
    <div className="space-y-6">
      {/* Header with Points */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-500" />
            {t('solver.title')}
          </h2>
          <p className="text-gray-600">{t('solver.subtitle')}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-bold">{t('solver.points', { count: stats.userPoints })}</span>
          </div>
          <Badge variant="secondary">{t('solver.problemsSolved', { count: solvedProblems.length })}</Badge>
        </div>
      </div>

      <Tabs defaultValue="solver" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solver">{t('solver.tabs.solver')}</TabsTrigger>
          <TabsTrigger value="challenges">{t('solver.tabs.challenges')}</TabsTrigger>
          <TabsTrigger value="tutorial">{t('solver.tabs.tutorial')}</TabsTrigger>
        </TabsList>

        <TabsContent value="solver" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  {t('solver.input.title')}
                </CardTitle>
                <CardDescription>
                  {t('solver.input.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipes">{t('solver.input.recipesLabel')}</Label>
                  <Textarea
                    id="recipes"
                    placeholder="awakening = snakefangs + wolfbane&#10;strengthening = awakening + moonstone"
                    value={recipes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecipes(e.target.value)}
                    className="min-h-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('solver.input.recipesHint')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="target">{t('solver.input.targetLabel')}</Label>
                  <Input
                    id="target"
                    placeholder="awakening"
                    value={targetPotion}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetPotion(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSolve}
                    disabled={isLoading || !recipes.trim() || !targetPotion.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('solver.input.solving')}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {t('solver.input.solve')}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetSolver}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Solution Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t('solver.solution.title')}
                </CardTitle>
                <CardDescription>
                  {t('solver.solution.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {solution ? (
                  <div className="space-y-4">
                    {solution.minOrbs >= 0 ? (
                      <>
                        <div className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            {solution.minOrbs}
                          </div>
                          <p className="text-gray-700">{t('solver.solution.minOrbsLabel')}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">{t('solver.solution.stepsTitle')}</h4>
                          <div className="space-y-2">
                            {solution.steps.map((step, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                <Badge variant="outline" className="min-w-8 h-6 flex items-center justify-center">
                                  {index + 1}
                                </Badge>
                                <span className="text-sm">
                                  {t(step.depth === 0 ? 'solver.step.top' : 'solver.step.nested', {
                                    potion: step.potion,
                                    ingredients: step.ingredients.join(' + '),
                                    orbs: step.orbs,
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Alert>
                          <Lightbulb className="h-4 w-4" />
                          <AlertTitle>{t('solver.solution.explanationTitle')}</AlertTitle>
                          <AlertDescription>{renderExplanation(solution.explanation)}</AlertDescription>
                        </Alert>
                      </>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTitle>{t('solver.solution.errorTitle')}</AlertTitle>
                        <AlertDescription>{renderExplanation(solution.explanation)}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('solver.solution.emptyState')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleProblems.map((problem, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{t(`solver.samples.${problem.key}.title`)}</CardTitle>
                    <Badge className={`${getDifficultyColor(problem.difficulty)} text-white`}>
                      {t(`solver.difficulty.${problem.difficulty}`)}
                    </Badge>
                  </div>
                  <CardDescription>{t(`solver.samples.${problem.key}.description`)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">{t('solver.challenges.recipesLabel')}</p>
                      <div className="text-xs bg-gray-50 p-2 rounded">
                        {problem.recipes.slice(0, 2).map((recipe, i) => (
                          <div key={i}>{recipe}</div>
                        ))}
                        {problem.recipes.length > 2 && <div>{t('solver.challenges.andMore')}</div>}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        {t('solver.challenges.targetLabel')} <code className="bg-gray-100 px-1 rounded">{problem.target}</code>
                      </span>
                      {solvedProblems.includes(problem.key) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {t('solver.challenges.solvedBadge')}
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={() => loadSampleProblem(problem)}
                      variant="outline"
                      className="w-full"
                    >
                      {t('solver.challenges.tryChallenge')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tutorial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('solver.tutorial.title')}</CardTitle>
              <CardDescription>{t('solver.tutorial.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">{t('solver.tutorial.overviewTitle')}</h4>
                <p className="text-sm text-gray-600">
                  {t('solver.tutorial.overviewText')}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('solver.tutorial.approachTitle')}</h4>
                <div className="space-y-2 text-sm">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-start gap-2">
                      <Badge variant="outline" className="min-w-6 h-6 flex items-center justify-center text-xs">{n}</Badge>
                      <span>{t(`solver.tutorial.approach${n}`)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('solver.tutorial.recipeFormatTitle')}</h4>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                  <div>potion_name = ingredient1 + ingredient2</div>
                  <div>awakening = snakefangs + wolfbane</div>
                  <div>strengthening = awakening + moonstone</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t('solver.tutorial.educationalTitle')}</h4>
                <p className="text-sm text-gray-600">
                  {t('solver.tutorial.educationalIntro')}
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n}>• {t(`solver.tutorial.eduPoint${n}`)}</li>
                  ))}
                </ul>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>{t('solver.tutorial.realWorldTitle')}</AlertTitle>
                <AlertDescription>
                  {t('solver.tutorial.realWorldText')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
