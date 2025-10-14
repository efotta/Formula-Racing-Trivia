
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/admin-auth';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAccess(request);
    
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error || 'Admin access required' }, { status: 403 });
    }

    // Fetch all questions from database
    const questions = await prisma.questions.findMany({
      orderBy: [
        { level: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found in database' }, { status: 404 });
    }

    // Group questions by level
    type Question = typeof questions[number];
    const questionsByLevel = questions.reduce((acc: Record<number, Question[]>, question: Question) => {
      if (!acc[question.level]) {
        acc[question.level] = [];
      }
      acc[question.level].push(question);
      return acc;
    }, {} as Record<number, Question[]>);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add metadata worksheet
    const metadataData = [
      ['Property', 'Value'],
      ['Total Questions', questions.length.toString()],
      ['Total Levels', Object.keys(questionsByLevel).length.toString()],
      ['Export Date', new Date().toISOString().split('T')[0]],
      ['Format Version', '2.0'],
      ['Source', 'Formula Trivia Challenge Admin Panel']
    ];

    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

    // Add questions worksheet
    const questionsData = [
      ['ID', 'Level', 'Level Name', 'Question Type', 'Question', 'Correct Answer', 'Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3', 'Created At', 'Updated At']
    ];

    questions.forEach((question: Question) => {
      const wrongAnswers = question.wrongAnswers || [];
      questionsData.push([
        question.id,
        question.level.toString(),
        question.levelName,
        question.questionType || 'Fixed',
        question.question,
        question.correctAnswer,
        wrongAnswers[0] || '',
        wrongAnswers[1] || '',
        wrongAnswers[2] || '',
        question.createdAt.toISOString(),
        question.updatedAt.toISOString()
      ]);
    });

    const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Questions');

    // Add level summary worksheet
    const levelSummaryData = [
      ['Level', 'Level Name', 'Total Questions', 'Sample Question']
    ];

    (Object.entries(questionsByLevel) as [string, Question[]][]).forEach(([level, levelQuestions]) => {
      const levelNum = parseInt(level);
      const levelName = levelQuestions[0]?.levelName || `Level ${levelNum}`;
      const sampleQuestion = levelQuestions[0]?.question || 'No questions available';
      
      levelSummaryData.push([
        levelNum.toString(),
        levelName,
        levelQuestions.length.toString(),
        sampleQuestion
      ]);
    });

    const levelSummarySheet = XLSX.utils.aoa_to_sheet(levelSummaryData);
    XLSX.utils.book_append_sheet(workbook, levelSummarySheet, 'Level Summary');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer'
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `formula-trivia-questions-${timestamp}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ 
      error: 'Failed to export Excel file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
