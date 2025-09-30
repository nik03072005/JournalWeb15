import { connectToDatabase } from '@/lib/db';
import Journal from '@/models/journelModel';
import Subject from '@/models/subjectModel';
import Type from '@/models/typeModel';
import UserModel from '@/models/userModel';

export async function GET(req) {
  try {
    await connectToDatabase();

    // Get local data counts
    const [localJournals, subjects, types, users] = await Promise.all([
      Journal.find().populate('subject', 'subjectName'),
      Subject.find(),
      Type.find(),
      UserModel.find()
    ]);

    // Count local data by types
    const localTypeStats = {};
    localJournals.forEach(journal => {
      const type = journal.type || 'Unknown';
      localTypeStats[type] = (localTypeStats[type] || 0) + 1;
    });

    // Count by subjects
    const subjectStats = {};
    localJournals.forEach(journal => {
      const subjectName = journal.subject?.subjectName || 'Unknown';
      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + 1;
    });

    // Count users by role
    const userRoleStats = {};
    users.forEach(user => {
      const role = user.role || 'user';
      userRoleStats[role] = (userRoleStats[role] || 0) + 1;
    });

    // Count articles vs books locally
    const localArticles = localJournals.filter(journal => 
      journal.type && !journal.type.toLowerCase().includes('book')
    ).length;
    
    const localBooks = localJournals.filter(journal => 
      journal.type && journal.type.toLowerCase().includes('book')
    ).length;

    // Prepare response data (local only)
    const stats = {
      overview: {
        totalLocalItems: localJournals.length,
        totalSubjects: subjects.length,
        totalTypes: types.length,
        totalUsers: users.length,
        totalLocalArticles: localArticles,
        totalLocalBooks: localBooks
      },
      localTypeBreakdown: localTypeStats,
      subjectBreakdown: subjectStats,
      userRoleBreakdown: userRoleStats,
      contentTypeComparison: {
        articles: localArticles,
        books: localBooks,
        other: localJournals.length - localArticles - localBooks
      }
    };

    return Response.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch admin statistics'
    }, { status: 500 });
  }
}
