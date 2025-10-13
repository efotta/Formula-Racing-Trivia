
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle, Clock, Flag, Trophy } from 'lucide-react';

interface PenaltyRulesProps {
  open: boolean;
  onClose: () => void;
}

export default function PenaltyRules({ open, onClose }: PenaltyRulesProps) {
  const levels = [
    {
      number: 1,
      name: 'Rookie',
      penalties: 'None',
      color: 'bg-green-500'
    },
    {
      number: 2,
      name: 'Midfielder',
      penalties: 'None',
      color: 'bg-blue-500'
    },
    {
      number: 3,
      name: 'Front Runner',
      penalties: '+1 second per wrong answer',
      color: 'bg-yellow-500'
    },
    {
      number: 4,
      name: 'World Champion',
      penalties: '+1 second per wrong answer + 5-second Grid Drop penalty',
      color: 'bg-orange-500'
    },
    {
      number: 5,
      name: 'Legend',
      penalties: '+1 second per wrong answer + 10-second Loss of Sponsorship penalty',
      color: 'bg-red-500'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto bg-gray-800">
        <div className="max-w-6xl mx-auto p-2 sm:p-4">
          <div className="mb-2 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500" />
              <h1 className="text-lg sm:text-3xl font-bold text-white">Formula Penalty System</h1>
            </div>
          </div>

          {/* DNF System */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 transition-all duration-200 hover:shadow-lg">
            <h3 className="font-semibold text-white mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              DNF (Did Not Finish) System
            </h3>
            <ul className="text-gray-300 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
              <li>• 3 errors = Level restart (DNF)</li>
              <li>• All 25 questions must be answered correctly to advance</li>
              <li>• No mid-game saves</li>
            </ul>
          </div>

          {/* Level Penalties */}
          <div className="mb-2 sm:mb-4">
            <h3 className="font-semibold mb-1 sm:mb-2 flex items-center gap-2 text-white text-sm sm:text-base">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Level Penalties
            </h3>
            <div className="space-y-1 sm:space-y-2">
              {levels.map((level) => (
                <div
                  key={level.number}
                  className="bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 ${level.color} rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base`}>
                        {level.number}
                      </div>
                      <div className="flex-1 sm:flex-none">
                        <h4 className="font-semibold text-white text-sm sm:text-lg">{level.name}</h4>
                      </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className="text-xs sm:text-sm text-white">
                        <strong>Penalties:</strong> <span className="text-gray-300">{level.penalties}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Timing Info */}
          <div className="bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 mb-2 sm:mb-4 transition-all duration-200 hover:shadow-lg">
            <h3 className="font-semibold text-white mb-1 sm:mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Timing System
            </h3>
            <ul className="text-gray-300 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
              <li>• Precise timing with 3 decimal places</li>
              <li>• Timer runs continuously during level</li>
              <li>• Final time = Race time + Penalty time</li>
            </ul>
          </div>

          <div className="mt-3 sm:mt-6 text-center">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-4 sm:px-6 py-2 border-gray-500 text-gray-900 hover:bg-gray-700 hover:text-white bg-white text-sm sm:text-base"
            >
              Return to Game
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
