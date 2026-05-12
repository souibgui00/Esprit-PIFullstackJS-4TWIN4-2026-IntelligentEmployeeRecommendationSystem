const mongoose = require('mongoose');
mongoose.connect('mongodb://sarra_mrabet:sarra@ac-skuyy89-shard-00-00.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-01.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-02.thpvndq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-cr5hej-shard-0&tls=true&retryWrites=true&w=majority')
.then(async () => { 
    const db = mongoose.connection.db; 
    const u = await db.collection('users').findOne({email: 'mohamedamine.souibgui@esprit.tn'}); 
    console.log('User skills:', JSON.stringify(u.skills, null, 2)); 
    const skillDocs = await db.collection('skills').find({_id: {'$in': u.skills.map(s => s.skillId)}}).toArray(); 
    console.log('Skill docs:', skillDocs.map(s => s.name)); 
    process.exit(0); 
}).catch(console.error);
