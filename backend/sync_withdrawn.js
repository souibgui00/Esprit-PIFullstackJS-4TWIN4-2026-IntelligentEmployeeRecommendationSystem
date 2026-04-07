const mongoose = require('mongoose');
const { Types } = mongoose;
const Assignment = require('./dist/assignments/schema/assignment.schema').AssignmentSchema;
const Participation = require('./dist/participations/schema/participation.schema').ParticipationSchema;

async function run() {
  await mongoose.connect('mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/?appName=PI');
  
  const aModel = mongoose.model('Assignment', Assignment);
  const pModel = mongoose.model('Participation', Participation);

  const withdrawnParticipations = await pModel.find({ status: 'withdrawn' }).exec();
  console.log('Found', withdrawnParticipations.length, 'withdrawn participations.');

  let fixed = 0;
  for (const p of withdrawnParticipations) {
     const asgn = await aModel.findOne({
        userId: new Types.ObjectId(p.userId),
        activityId: new Types.ObjectId(p.activityId),
        status: 'accepted'
     });
     
     if (asgn) {
        console.log('Found straggling accepted assignment for withdrawn participation:', asgn._id);
        asgn.status = 'declined';
        asgn.reason = 'Employee withdrew after accepting (historical sync).';
        await asgn.save();
        fixed++;
     }
  }
  
  console.log('Fixed', fixed, 'straggling assignments.');
  process.exit(0);
}
run();
