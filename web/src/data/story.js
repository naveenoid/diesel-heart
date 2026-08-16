/* ── The campaign ─────────────────────────────────────────────────────────────
   Twelve chapters. Each is: some people talking, a run, and the consequences of
   how you drove it.

   Dialogue beats are `{ who, lines, choices? }`. A line beginning with '*' is a
   stage direction. Choices carry an `effect` the campaign applies and a `reply`
   the scene plays before moving on.

   Run scenarios are consumed by game/run.js. Beyond the driving parameters they
   may carry: `festival` (a name — big goodwill), `heritage` (the Missus in front
   of a crowd), `rescue` (the wreck train), `optional` + `maxCars` (the yard makes
   the train up itself). */

export const CHARACTERS = {
    meera:   { name: 'Meera Rajendran',   role: 'Chief mechanic' },
    dell:    { name: 'Odell Bray',        role: 'Engineer, forty-one years' },
    hal:     { name: 'Halvard Ines',      role: 'Continental Pacific — chief dispatcher' },
    ivy:     { name: 'Dr Ivy Serrano',    role: 'Coldspring clinic' },
    tomas:   { name: 'Tomas Weir',        role: 'Fourteen, and at the fence again' },
    corinne: { name: 'Corinne Vance',     role: 'Peregrine Instruments — logistics' },
    nadia:   { name: 'Nadia Okonkwo',     role: 'Tannery Flats mill' },
    dhanam:  { name: 'Dhanam Aunty',      role: 'Ticket window, Marrow Bend. And the tea.' },
    verena:  { name: 'Verena Ziegler',    role: 'Winterthur — writes about the Missus' },
    you:     { name: 'You',               role: 'Whoever is left to do it' },
    radio:   { name: 'Radio',             role: 'Channel 2 — Halloway dispatch' },
    narrator:{ name: '',                  role: '' },
};

export const CHAPTERS = [

/* ══ 1 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'cold-start',
    title: 'Cold Start',
    subtitle: 'Sable Valley Railway — Thursday, 04:10',
    epigraph: 'Abel Quist ran this railway for thirty-one years. He was buried on Tuesday. ' +
              'There is a train to Halloway on Thursday.',

    opening: [
        { who:'narrator', lines:[
            '*The shed smells of diesel, cold iron and the coffee Meera made at two in the morning and forgot.*',
            '*Painted above the doors, in letters somebody repaints every spring:*  **THE LOAD NEEDS PULLING.**',
        ]},
        { who:'meera', lines:[
            'He started on the third try. Third try is fine. Paravaalla.',
            '*She pats the hood without looking at it.* Velaikkaran. That is what appa called him, and it stuck, ' +
            'because it is true — he is the one who does the work. Whatever the work is. Whoever else has broken.',
            'I am not going to pretend this is a good week to learn. But avan does not care what kind of week it is, ' +
            'and neither does the mill.',
        ]},
        { who:'dell', lines:[
            'Abel drove him forty years. You are going to drive him badly for a while. That is allowed.',
            'Just remember the one thing. Two hundred and sixty tons does not stop because you would like it to.',
        ]},
        { who:'you', choices:[
            { text:'"What did Abel tell you, the first time you took him out?"',
              reply:{ who:'dell', lines:[
                  'He said: look further ahead than feels sensible. Then look further than that.',
                  '*He laughs, then does not.* He also said the coffee was undrinkable. He was right about both.',
              ]}, effect:{ rep:1 } },
            { text:'"Then let\'s not keep the mill waiting."',
              reply:{ who:'meera', lines:[
                  'Seri. Brake pipe charged, eight hundred litres, cooling group honest today.',
                  'Take him gently down to Halloway. Gently.',
              ]}, effect:{ } },
            { text:'"I don\'t think I can do this."',
              reply:{ who:'meera', lines:[
                  '*She wipes her hands on a rag that has not been clean since the nineties.*',
                  'No. Probably not. Do it anyway — that is the entire job, kanna.',
              ]}, effect:{ morale:{ crew:1 } } },
        ]},
        { who:'narrator', lines:[
            '*One more thing, and nobody explains it because everybody here already knows.*',
            '*The baggage car goes wherever Velaikkaran goes. Parcels nobody collected, a bicycle wheel, a crate ' +
            'addressed to a shop that shut in 1998, and the accumulated unfinished business of four towns.*',
            '*It gets lighter when people trust you. Nobody can tell you why. It simply does.*',
        ]},
    ],

    run: {
        title: 'Marrow Bend → Halloway Junction',
        orders: 'Mill product and the valley\'s mail to the interchange. Downgrade the whole way. ' +
                'Be on the interchange track by 05:10 or Continental Pacific gives the slot away.',
        from:'marrow', to:'halloway', loco:'wdm2',
        cars:['boxcar','combine','caboose'],
        hour: 4.35, weather:'clear', adhesion:'dry', ambient: 24,
        schedule: 305, hardLimit: 470,
        traffic: [], hazards: [],
        radio:[
            { atS: 60,   who:'dell',  text:'Notch up steady. One at a time — he is not a car.' },
            { atS: 900,  who:'dell',  text:'Falling grade now. Let the hill do the work and keep a hand near the brake.' },
            { atS: 1800, who:'dell',  text:'Bridge coming. Thirty over the river, and that is not a suggestion.' },
            { atS: 2700, who:'radio', text:'Sable Valley 9X, Halloway. Interchange track is yours. Do not be late and do not be early.' },
        ],
        objectives:[
            { id:'arrive', text:'Stop at Halloway Junction' },
            { id:'ontime', text:'Arrive inside the slot' },
            { id:'limits', text:'Observe every speed restriction' },
            { id:'clean',  text:'No emergency applications' },
        ],
        pay: 900,
    },

    closing: [
        { who:'dell', lines:[
            'That will do. That will do fine.',
            'You will get the stopping. Everybody starts by stopping too late and then spends a month stopping too early.',
        ]},
        { who:'meera', lines:[
            'Fuel for that trip, two hundred and change. The mill and the mail together, about nine hundred.',
            'Which sounds like a railway until you see what a traction motor costs. Science freight is what pays.',
            'Remember that. And then remember what it is you are paying for.',
        ]},
    ],
},

/* ══ 2 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-slot',
    title: 'The Slot',
    subtitle: 'Halloway Junction — 04:38',
    epigraph: 'We do not own the mainline. We are a guest on it, at the hours nobody else wants.',

    opening: [
        { who:'hal', lines:[
            'Sable Valley. You are asking for a daylight slot.',
            'I have eleven Continental Pacific movements through this junction between six and ten. You are a ' +
            'twelve mile short line with four locomotives, one of which is from 1928.',
            'You get 04:40. You have always got 04:40.',
        ]},
        { who:'you', choices:[
            { text:'"04:40 means our crews start at two. That is how people get hurt."',
              reply:{ who:'hal', lines:[
                  '*A pause on the line long enough to hear him decide something.*',
                  'Noted. It is still 04:40. But it is noted, and I do not note things twice.',
              ]}, effect:{ rep:2 } },
            { text:'"We\'ll take it. We\'ll take it clean and we\'ll take it early."',
              reply:{ who:'hal', lines:[
                  'Everyone says clean. Show me a month of it and we will talk about six-fifteen.',
              ]}, effect:{ rep:3 } },
            { text:'"What did Abel get?"',
              reply:{ who:'hal', lines:[
                  'Abel got 04:40 for thirty-one years and never once complained, which I always thought was a ' +
                  'failure of imagination on his part.',
                  '*Almost warmly.* He also never took a red. Not one, in thirty-one years. Beat that and the ' +
                  'conversation changes.',
              ]}, effect:{ flag:'hal-abel' } },
        ]},
        { who:'dell', lines:[
            'Signals from here on. Green, you run. Yellow, you get ready to stop at the next one. Red, you stop — ' +
            'before it, not level with it.',
            'A red passed is a SPAD, and a SPAD is how a short line stops being a railway.',
        ]},
    ],

    run: {
        title: 'Halloway Junction → Tannery Flats',
        orders: 'Empties up the valley to the mill, plus the morning stopper for the mill hands. ' +
                'Continental Pacific has a coal train working ahead of you. Obey your signals.',
        from:'halloway', to:'tannery', loco:'wdm2',
        cars:['coach','combine','hopper','hopper','caboose'],
        hour: 4.7, weather:'clear', adhesion:'dry', ambient: 22,
        schedule: 620, hardLimit: 850,
        traffic:[
            { id:'cp-441', name:'CP 441 coal', dir:1, s:2400, v:7.5, cruise:8.5, kind:'freight', cars:9,
              takesSiding:'Wilder siding' },
        ],
        hazards:[ { type:'crossing', s:4600 } ],
        radio:[
            { atS: 200,  who:'radio', text:'9X, you are following CP 441 up the valley. Keep your distance and watch your aspects.' },
            { atS: 2600, who:'radio', text:'9X, 441 is taking Wilder siding to let you by. Approach on green and do not dawdle.' },
            { atS: 4340, who:'dell',  text:'Whistle board. Sound it — that crossing has no gates and never has.' },
        ],
        objectives:[
            { id:'arrive', text:'Stop at Tannery Flats' },
            { id:'nospad', text:'No signal passed at danger' },
            { id:'whistle',text:'Whistle at every crossing' },
        ],
        pay: 700,
    },

    closing: [
        { who:'nadia', lines:[
            'Two hundred and six people work in that building behind me. Sixty of them just got off your train.',
            'The freight pays you better. I know that. I am telling you anyway.',
        ]},
    ],
},

/* ══ 3 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'rush-hour',
    title: 'Rush Hour',
    subtitle: 'Kottapuram Central — 08:10',
    epigraph: 'Four hundred thousand people, eleven platforms, and a level crossing every half mile ' +
              'with somebody\'s scooter already on it.',

    opening: [
        { who:'meera', lines:[
            'Kottapuram at eight in the morning. Aiyo.',
            'Down there we are nobody. Suburban units every four minutes, a signal every three hundred metres, ' +
            'and four crossings where the gatekeeper is a man on a bicycle who may or may not have arrived.',
            'Ten miles an hour where it says ten. Not eleven. In the city, eleven is how somebody\'s amma ends up ' +
            'in the newspaper.',
        ]},
        { who:'dell', lines:[
            'Whistle at everything. Whistle at things that are not there. Nobody in that city has ever once looked left.',
        ]},
        { who:'corinne', lines:[
            'Peregrine has an instrument van on your train. It comes off at Halloway for the eleven o\'clock.',
            'I am aware you are also carrying half of Perambur to work. I am not asking you to choose. ' +
            'I am observing that you will have to.',
        ]},
        { who:'you', choices:[
            { text:'"The van and the people go on the same train. That\'s the whole idea."',
              reply:{ who:'corinne', lines:[
                  'Then it is a slower train than I would design, and it arrives, which the ones I design ' +
                  'frequently do not.',
                  '*She almost smiles.* Very well.',
              ]}, effect:{ goodwill:2, rep:1 } },
            { text:'"How late can the van be before it stops being worth anything?"',
              reply:{ who:'corinne', lines:[
                  'Eleven o\'clock. After that it is a very expensive box of glass going to the wrong city.',
              ]}, effect:{ flag:'corinne-eleven' } },
        ]},
    ],

    run: {
        title: 'Kottapuram Central → Marrow Bend',
        orders: 'The 08:10 up: commuters, the mail, and a Peregrine instrument van for the interchange. ' +
                'Four unmanned crossings inside the city, signals every few hundred metres. Whistle at all of it.',
        from:'kottapuram', to:'marrow', loco:'wdm2',
        cars:['coach','coach','combine','lab','caboose'],
        optional:['coach','festival','boxcar','reefer'],
        maxCars: 8,
        hour: 8.2, weather:'clear', adhesion:'dry', ambient: 33,
        schedule: 1250, hardLimit: 1600,
        traffic:[
            { id:'sub-14', name:'Suburban 14', dir:-1, s:3100, v:0, cruise:18, kind:'express', cars:6, releaseAt: 30 },
            { id:'cp-62',  name:'CP 62 vans',  dir:1,  s:2500, v:6,  cruise:9,  kind:'freight', cars:7,
              takesSiding:'Vandalur loop' },
        ],
        meets:[ { trainId:'sub-14', siding:'Perambur loop' } ],
        hazards:[
            { type:'crossing', s:1150 }, { type:'crossing', s:2320 },
            { type:'crossing', s:2980 }, { type:'crossing', s:3420 },
        ],
        radio:[
            { atS: 120,  who:'radio', text:'9X out of Kottapuram. You are between suburban paths the whole way to Vandalur. Do not lose time and do not make it up either.' },
            { atS: 900,  who:'dell',  text:'Kandan Street. Whistle. There is a school on the far side and it is eight in the morning.' },
            { atS: 2000, who:'radio', text:'9X, Suburban 14 is running against you. Perambur loop — be inside it. He does not slow down for anybody.' },
            { atS: 3300, who:'meera', text:'Vandalur Gate. The last one. After this the city lets go of us.' },
            { atS: 5200, who:'dell',  text:'*Quietly.* There. Hills. I never get used to how fast it stops.' },
        ],
        objectives:[
            { id:'arrive',  text:'Reach Marrow Bend' },
            { id:'whistle', text:'Whistle at every city crossing' },
            { id:'limits',  text:'Observe every speed restriction' },
            { id:'nospad',  text:'No signal passed at danger' },
        ],
        pay: 400,
    },

    closing: [
        { who:'dhanam', lines:[
            '*She has the tea poured before the brake pipe has finished hissing.*',
            'Vanakkam. Sit, sit. Two minutes.',
            'Forty years I am selling tickets on this platform. You know what changed when the bus company came? ' +
            'Nothing. The bus does not wait for anybody. You wait.',
            'That is the whole difference and it is the only difference.',
        ]},
    ],
},

/* ══ 4 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'sabre-hill',
    title: 'Sabre Hill',
    subtitle: 'Tannery Flats — 09:15',
    epigraph: 'Two point two percent for a mile and a half. Everything this railway is, it is because of that hill.',

    opening: [
        { who:'meera', lines:[
            'Here is what will happen. You will hold notch eight because you want the speed, the water temperature ' +
            'will climb, and at ninety-two degrees he will pull his own power back to save himself.',
            'And then you will be doing eight miles an hour halfway up a hill with the whole train pushing you ' +
            'back down it.',
        ]},
        { who:'dell', lines:[
            'The trick is you decide before the hill, not on it. Get your speed at the bottom and spend it climbing.',
            'Notch seven all the way up beats notch eight for forty seconds and notch four for four minutes. ' +
            'That is the whole of it.',
        ]},
        { who:'you', choices:[
            { text:'"Can we cut the train? Two trips?"',
              reply:{ who:'meera', lines:[
                  'Two trips is two slots and we have one. One train, or next week.',
              ]}, effect:{} },
            { text:'"What happens if he stalls on the grade?"',
              reply:{ who:'dell', lines:[
                  'Then you hold what you have with the air, and you back down to Tannery, and you try again ' +
                  'with a lighter train and a worse reputation.',
                  'It has happened to me twice. I remember both.',
              ]}, effect:{ flag:'stall-warned' } },
        ]},
    ],

    run: {
        title: 'Tannery Flats → Coldspring',
        orders: 'As much of the mill\'s backlog as you dare take over Sabre Hill, and the midday stopper for ' +
                'the upper valley. Watch the water temperature. Twenty-five through the Sabre curves.',
        from:'tannery', to:'coldspring', loco:'wdm2',
        cars:['hopper','hopper','boxcar','coach','caboose'],
        optional:['hopper','hopper','boxcar','gondola','flat','combine'],
        maxCars: 12,
        hour: 9.4, weather:'clear', adhesion:'dry', ambient: 31,
        schedule: 1000, hardLimit: 1400,
        traffic:[],
        hazards:[ { type:'crossing', s:1300 }, { type:'crossing', s:5400 } ],
        radio:[
            { atS: 400,  who:'dell',  text:'Grade starts at the mill throat. Build what you can now — you will not build it later.' },
            { atS: 2400, who:'dell',  text:'This is it. Sabre. Watch that temperature gauge like it owes you money.' },
            { atS: 4200, who:'meera', text:'If he derates, back off two notches and let him breathe. He comes back. He always comes back.' },
            { atS: 5200, who:'dell',  text:'Summit board. Now it is a different problem — all that weight wanting to reach Coldspring before you do.' },
        ],
        objectives:[
            { id:'arrive',   text:'Stop at Coldspring' },
            { id:'noderate', text:'Do not cook the engine' },
            { id:'nostall',  text:'Do not stall on the grade' },
        ],
        pay: 600,
    },

    closing: [
        { who:'meera', lines:[
            'Water temperature peaked and came back down. Cooling group honest. Prime mover tired.',
            '*She writes on the whiteboard and underlines it twice.* Radiator core before winter. ' +
            'I do not know where from yet.',
        ]},
        { who:'dell', lines:[
            'You heard him change note on the last quarter mile? That flat sound?',
            'That is him working. That is the best noise there is.',
        ]},
    ],
},

/* ══ 5 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'pongal',
    title: 'Pongal',
    subtitle: 'Kottapuram Central — the fourteenth, 05:40',
    epigraph: 'Everybody who left the valley to find work in the city comes back for four days in January. ' +
              'All of them. On the same morning. On us.',

    opening: [
        { who:'dhanam', lines:[
            'Seven hundred tickets. Seven hundred, and I stopped counting at six because people stopped asking.',
            'Kanna, listen. Every one of those seven hundred has a mother expecting them at a house with a kolam ' +
            'already drawn at the door. Not tomorrow. Today.',
        ]},
        { who:'meera', lines:[
            'Extras on the back. Standing room, garlands on the roof, somebody\'s uncle riding in the guard\'s ' +
            'compartment because he is somebody\'s uncle.',
            'It pays almost nothing. Second class on a branch line, and half of them are children and travel free.',
        ]},
        { who:'you', choices:[
            { text:'"Then we run it at a loss and we run every one of them."',
              reply:{ who:'dhanam', lines:[
                  '*She does not say thank you. She goes and opens the second ticket window, which has not been ' +
                  'opened since Abel.*',
              ]}, effect:{ goodwill:6, morale:{ kottapuram:2 } } },
            { text:'"How many can Velaikkaran actually lift up Sabre?"',
              reply:{ who:'meera', lines:[
                  'That is the correct question and I hate that it is the correct question.',
                  'Take what he will lift. Leaving people standing on Pongal morning is a thing this valley will ' +
                  'remember longer than it remembers anything you do right.',
              ]}, effect:{ flag:'pongal-weighed' } },
        ]},
        { who:'dell', lines:[
            'Drive it like there is a grandmother standing in the vestibule. Because there is. I have seen her.',
        ]},
    ],

    run: {
        title: 'Kottapuram Central → Marrow Bend — the Pongal special',
        orders: 'The valley coming home. Every extra you couple to is a hundred people who get there, and every ' +
                'one you leave is a hundred who do not. It pays nothing. Take them anyway.',
        from:'kottapuram', to:'marrow', loco:'wdm2',
        cars:['festival','festival','combine','caboose'],
        optional:['festival','festival','coach','coach'],
        maxCars: 9,
        festival: 'Pongal',
        hour: 5.7, weather:'clear', adhesion:'dry', ambient: 24,
        schedule: 1250, hardLimit: 1650,
        traffic:[
            { id:'sub-3', name:'Suburban 3', dir:-1, s:2900, v:0, cruise:17, kind:'express', cars:5, releaseAt: 45 },
        ],
        meets:[ { trainId:'sub-3', siding:'Perambur loop' } ],
        hazards:[ { type:'crossing', s:1150 }, { type:'crossing', s:2320 }, { type:'crossing', s:3420 } ],
        radio:[
            { atS: 100,  who:'dhanam', text:'All aboard and forty more on the platform. I have told them the next one is at nine. It is not. Drive.' },
            { atS: 1900, who:'radio',  text:'9X, festival special — Suburban 3 against you at Perambur. Even today, he does not stop for you.' },
            { atS: 4400, who:'dell',   text:'Somebody is singing in the second extra. The whole car has joined in. I am not going to describe it, you can hear it.' },
            { atS: 6600, who:'meera',  text:'Marrow Bend is lit up. All of it. Somebody has strung lights the length of the platform.' },
        ],
        objectives:[
            { id:'arrive',  text:'Bring them home to Marrow Bend' },
            { id:'ontime',  text:'Before the morning is gone' },
            { id:'whistle', text:'Whistle at every crossing' },
            { id:'clean',   text:'No emergency applications — they are standing up back there' },
        ],
        pay: 200,
    },

    closing: [
        { who:'narrator', lines:[
            '*It takes eleven minutes to empty the train. Nobody is in a hurry once they are off it.*',
            '*Somebody has brought a pot to the end of the platform and is boiling milk on a stove that should not ' +
            'be there, and when it boils over the whole platform shouts at once.*',
        ]},
        { who:'dhanam', lines:[
            'Pongalo Pongal.',
            '*She puts a plate in your hand and walks off before you can say anything about it.*',
        ]},
    ],
},

/* ══ 6 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'what-coldspring-needs',
    title: 'What Coldspring Needs',
    subtitle: 'Marrow Bend platform — 05:50, raining',
    epigraph: 'The road to Coldspring washed out on the fourteenth. It washes out every spring. ' +
              'This year the clinic did not have a month of stock in hand.',

    opening: [
        { who:'ivy', lines:[
            'I have oxygen for two days. I have a woman in her thirty-eighth week who should not be having this ' +
            'baby in Coldspring and cannot get out of Coldspring.',
            'The van is loaded. It is on your platform. I am not going to tell you how to drive.',
        ]},
        { who:'meera', lines:[
            'Rain since midnight. The rail will be greasy through the cut and he will slip if you snatch at it.',
            'Sand is in the boxes. Use it before you need it, not after.',
        ]},
        { who:'tomas', lines:[
            '*The boy is at the fence in a coat too big for him, in the rain, at ten to six.*',
            'Is that the medical van? The white one? Can I see it go?',
        ]},
        { who:'you', choices:[
            { text:'"Stand back from the fence and you can ride to the yard limit."',
              reply:{ who:'tomas', lines:[
                  '*He does not say anything for a second.*',
                  'I have watched this railway since I was six. Nobody ever said yes before.',
              ]}, effect:{ morale:{ marrow:2 }, goodwill:2, flag:'tomas-ride' } },
            { text:'"Watch from the platform, Tomas. Not today."',
              reply:{ who:'tomas', lines:[
                  'Okay. *He does not move from the fence.* Okay.',
              ]}, effect:{} },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Coldspring',
        orders: 'Medical van, stores and the morning stopper. Rain — reduced adhesion. ' +
                'The van is fragile: heavy braking will cost you glass and pressure vessels.',
        from:'marrow', to:'coldspring', loco:'wdm2',
        cars:['medical','boxcar','coach','combine','caboose'],
        hour: 5.9, weather:'rain', adhesion:'wet', ambient: 18,
        schedule: 1400, hardLimit: 1750,
        traffic:[
            { id:'cp-208', name:'CP 208 manifest', dir:-1, s:9200, v:0, cruise:19, kind:'freight', cars:8, releaseAt: 40 },
        ],
        meets:[ { trainId:'cp-208', siding:'Sabre siding' } ],
        hazards:[ { type:'crossing', s:1400 }, { type:'crossing', s:9200 } ],
        radio:[
            { atS: 300,  who:'radio', text:'9X, Halloway. CP 208 is westbound out of Kestrel Gap, running against you. You will take Sabre siding for the meet.' },
            { atS: 3000, who:'dell',  text:'Sabre siding is the one on the hill. Getting in is easy. Getting out on a wet 2.2 percent is the part nobody enjoys.' },
            { atS: 6900, who:'radio', text:'9X, 208 is clear. Main is yours to Coldspring.' },
        ],
        objectives:[
            { id:'arrive', text:'Stop at Coldspring' },
            { id:'cargo',  text:'Medical van intact' },
            { id:'meet',   text:'Clear the main for CP 208' },
        ],
        pay: 500,
    },

    closing: [
        { who:'ivy', lines:[
            'Cylinders intact. All six.',
            '*She is already walking away with a trolley.* Her name is going to be Wren. I asked. I do not usually ask.',
        ]},
        { who:'dell', lines:[
            'There it is. That is the reason. Everything else is arithmetic.',
        ]},
    ],
},

/* ══ 7 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'jugaad',
    title: 'Jugaad',
    subtitle: 'Marrow Bend enginehouse — Sunday',
    epigraph: '"There is a correct repair and there is a repair that runs on Monday. ' +
              'I have been doing the second one since I was nineteen." — Meera Rajendran',

    opening: [
        { who:'meera', lines:[
            'Number three traction motor. Armature scored, and there is no rewind shop within four hundred miles ' +
            'that will look at a WDM-2.',
            'A new motor is eleven thousand and eight weeks. We have neither.',
            'So: I isolate three, we run on five motors, and I shim the brush gear on two so it stops arcing. ' +
            'It will hold if you are gentle.',
        ]},
        { who:'you', choices:[
            { text:'"Do it. We\'ll drive around the weakness."',
              reply:{ who:'meera', lines:[
                  'Seri. And "gentle" means no wheelslip. Not one. Every slip puts current where I have asked it not to go.',
                  'Sand early. Notch up slow. Pretend the throttle is made of glass.',
              ]}, effect:{ flag:'bodge-traction' } },
            { text:'"What if we borrow against next month and buy the motor?"',
              reply:{ who:'meera', lines:[
                  '*She looks at you for a long moment.*',
                  'Then we are correct, and solvent, and not running in eight weeks. Abel borrowed once. ' +
                  'It took him six years to stop.',
                  'I will shim it.',
              ]}, effect:{ money:-1200, flag:'bodge-traction' } },
        ]},
        { who:'dell', lines:[
            'Five motors up Sabre with a load is not a thing I have done sober.',
            'We will do it slow. Slow is a plan.',
        ]},
    ],

    run: {
        title: 'Marrow Bend → Kestrel Gap',
        orders: 'Fuel, stores and the upper-valley stopper on five traction motors — take only what you must. ' +
                'Wheelslip will damage the bodged motor, and if it lets go on the hill you finish on what is left.',
        from:'marrow', to:'kestrel', loco:'wdm2',
        cars:['tank','combine','caboose'],
        optional:['tank','boxcar','flat','coach','reefer'],
        maxCars: 8,
        hour: 7.2, weather:'clear', adhesion:'dry', ambient: 28,
        schedule: 1150, hardLimit: 1550,
        bodge: { component:'traction', failChance: 0.55, slipSensitive: true },
        traffic:[],
        hazards:[ { type:'crossing', s:1400 }, { type:'crossing', s:9200 }, { type:'crossing', s:12700 } ],
        radio:[
            { atS: 100,  who:'meera', text:'Gentle. Notch two, wait, notch three. If he slips I will hear it from here.' },
            { atS: 5000, who:'dell',  text:'Sabre. Sand it before the grade bites, not when you are already spinning.' },
            { atS: 11000,who:'dell',  text:'Over the top. Now nurse him home.' },
        ],
        objectives:[
            { id:'arrive', text:'Reach Kestrel Gap' },
            { id:'noslip', text:'Keep the bodged motor alive' },
        ],
        pay: 800,
    },

    closing: [
        { who:'meera', lines:[
            '*She has the inspection cover off before the engine has stopped turning.*',
            'Brush gear is warm but it is not blue. Warm I can live with. Blue means we start again.',
            'That shim is going to outlive this railway. Do not tell anyone I said that.',
        ]},
    ],
},

/* ══ 8 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-missus',
    title: 'The Missus',
    subtitle: 'Marrow Bend — the heritage running, and a letter from Winterthur',
    epigraph: 'She was built to shunt a goods yard outside Winterthur for forty years and then be scrapped. ' +
              'Instead she is here, and the whole valley comes down to look at her.',

    opening: [
        { who:'verena', lines:[
            '*A letter, in a hand that learned to write before the war.*',
            'Grüezi mitenand. My father bought her in 1961 because nobody else would, and he never ran her, ' +
            'and I have felt guilty about that for fifty years.',
            'You are running her. In the mountains. With people behind her. *Es git nüt Bessers.* ' +
            'There is nothing better than that.',
            'One thing only, and then I will stop being an old woman about it. **Schaffe mit ihre, nöd gäge sie.** ' +
            'Work with her, not against her. If you hold the regulator wide open she will blow a joint, ' +
            'and she will not warn you twice.',
        ]},
        { who:'meera', lines:[
            'Care is not sentiment, whatever Dell says. It is the washout, the tubes, the glands, the hours ' +
            'nobody bills for.',
            'Look at that number in the shed before you take her out. Below thirty and she is a hundred people ' +
            'behind an unwashed boiler.',
            'And she does not drive like Velaikkaran at all. Pressure is a budget. Open her half and she makes ' +
            'more speed than open full, because on full she runs out of steam and then you have nothing.',
        ]},
        { who:'tomas', lines:[
            'I cleaned the fire. Meera showed me. I did the whole thing myself.',
            '*He is grey with ash and visibly the happiest anyone has been all year.*',
        ]},
        { who:'you', choices:[
            { text:'"Then you\'re firing her today. Do what Meera tells you."',
              reply:{ who:'tomas', lines:[
                  '*He is up the steps before you finish the sentence.*',
              ]}, effect:{ morale:{ marrow:3 }, goodwill:3, flag:'tomas-fires' } },
            { text:'"Watch from the platform. There\'ll be a next time and I mean it."',
              reply:{ who:'tomas', lines:[
                  'You always say next time.',
                  '*Then, fairly:* But you have never once not meant it. Okay.',
              ]}, effect:{} },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Tannery Flats — the heritage running',
        orders: 'The Missus, three vintage coaches, and every person in the valley who owns a camera. ' +
                'Half regulator. Watch the pressure, and do not let her blow a joint in front of them.',
        from:'marrow', to:'tannery', loco:'e33',
        cars:['coach','coach','combine'],
        heritage: true,
        hour: 10.6, weather:'clear', adhesion:'dry', ambient: 26,
        schedule: 620, hardLimit: 900,
        traffic:[],
        hazards:[ { type:'crossing', s:1400 } ],
        radio:[
            { atS: 80,   who:'meera', text:'Regulator half. Half. She makes more speed on half than on full — trust me before you trust the lever.' },
            { atS: 1500, who:'dell',  text:'There must be sixty people on that road bridge. Sixty. For a tank engine doing twenty.' },
            { atS: 2600, who:'meera', text:'Pressure is dropping. Shut off, let her make it back. The hill is not going anywhere.' },
            { atS: 3400, who:'verena',text:'*A postcard, arrived that morning, propped on the gauge glass.* Merci vilmal. Grüess us Winterthur.' },
        ],
        objectives:[
            { id:'arrive',  text:'Reach Tannery Flats' },
            { id:'noblow',  text:'Do not blow a joint' },
            { id:'nostall', text:'Do not run out of steam on the grade' },
            { id:'clean',   text:'No emergency applications — they are all watching' },
        ],
        pay: 350,
    },

    closing: [
        { who:'dell', lines:[
            'Nineteen twenty-eight. Built for a goods yard she never left for thirty years.',
            'And there is a boy on the footplate who was not born when she got here, and four hundred people ' +
            'took a photograph.',
            'I think about that more than is reasonable.',
        ]},
        { who:'meera', lines:[
            '*She is going over the motion with an oil can and a rag, and will be for another two hours.*',
            'Go home. I am fine. She is fine.',
            '*Later, to nobody:* Nalla ponnu.',
        ]},
    ],
},

/* ══ 9 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-cut',
    title: 'The Cut',
    subtitle: 'Sabre cut — 23:40, fog',
    epigraph: 'The rock above the Sabre cut has been coming down in its own time since before there was ' +
              'a railway under it.',

    opening: [
        { who:'radio', lines:[
            'Sable Valley 9X, Halloway. We have a report of debris on the line in the Sabre cut. ' +
            'Track walker cannot get up there before morning.',
            'Continental Pacific is not running the valley tonight. Whether you run it is your decision ' +
            'and your liability.',
        ]},
        { who:'ivy', lines:[
            'I have a man with a compound fracture and a helicopter that cannot fly in this.',
            'If you can get to Coldspring I can get him to Halloway and Halloway can get him to a surgeon.',
        ]},
        { who:'meera', lines:[
            'Fog, night, and a rock cut. Your headlight will show you maybe two hundred metres and you need ' +
            'four hundred to stop from forty.',
            'So you do not do forty. You do what you can stop inside of. That is not caution, kanna, it is arithmetic.',
        ]},
        { who:'you', choices:[
            { text:'"We go. Slow, lit up, and ready for it."',
              reply:{ who:'dell', lines:[
                  '*He is already pulling his coat on.*',
                  'I will ride the point with a lamp. Two sets of eyes is worth ten miles an hour.',
              ]}, effect:{ rep:2, goodwill:3, morale:{ coldspring:2 } } },
            { text:'"Not in fog. Not at night. First light."',
              reply:{ who:'ivy', lines:[
                  '*A long silence on an open channel.*',
                  'That is a defensible decision. I want you to know that I understand it.',
                  'I will call you at four.',
              ]}, effect:{ flag:'declined-night', goodwill:-3, morale:{ coldspring:-2 } } },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Coldspring',
        orders: 'Night. Fog. Sighting distance under two hundred metres. ' +
                'There is debris somewhere in the Sabre cut and nobody knows exactly where.',
        from:'marrow', to:'coldspring', loco:'wdm2',
        cars:['medical','combine','caboose'],
        hour: 23.7, weather:'fog', adhesion:'wet', ambient: 9,
        night: true,
        schedule: 1000, hardLimit: 1400,
        traffic:[],
        hazards:[
            { type:'crossing', s:1400 },
            { type:'rockfall', s:6520 },
        ],
        radio:[
            { atS: 200,  who:'dell', text:'Cannot see the whistle boards in this. I will call them.' },
            { atS: 4800, who:'dell', text:'Cut in about a mile. Get him down now — I want to be crawling before we are in it, not slowing down inside it.' },
            { atS: 7400, who:'dell', text:'*Quietly.* Clear. Clear and running. Take him on to Coldspring.' },
        ],
        objectives:[
            { id:'arrive',   text:'Reach Coldspring' },
            { id:'nostrike', text:'Do not strike the debris' },
        ],
        pay: 400,
    },

    closing: [
        { who:'dell', lines:[
            'Sandstone slab the size of a kitchen table, half on the four-foot.',
            'If we had been doing thirty we would still be up there. Some of us.',
        ]},
        { who:'ivy', lines:[
            'He is in surgery. He will keep the leg.',
            'I have stopped saying thank you to you people. It started to sound like it was optional.',
        ]},
    ],
},

/* ══ 10 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-wreck-train',
    title: 'The Wreck Train',
    subtitle: 'Marrow Bend — 02:20, and the phone will not stop',
    epigraph: 'The crane has sat behind the shed since 1974 with a tarpaulin over the jib. ' +
              'It has never once been needed. That was always the point of it.',

    opening: [
        { who:'radio', lines:[
            'Sable Valley — Halloway. CP 88 has put four wagons on the ground at the Vandalur curves. ' +
            'No injuries. The line is blocked, both roads, and everything behind it is standing.',
            'Continental Pacific\'s breakdown train is six hours away in the wrong direction.',
            'You are forty minutes away and you own a crane. I am asking. I have never asked.',
        ]},
        { who:'meera', lines:[
            'Aiyo. That crane has not turned a wheel since before I was born.',
            '*A pause, and then, differently:* It will turn tonight. I greased it in October. ' +
            'I do not know why I greased it in October.',
        ]},
        { who:'dell', lines:[
            'Crane, tool van, and Velaikkaran on the front because there is nobody else. Ninety-six tonnes ' +
            'of crane, and it rides like a barn door.',
            'Slow the whole way. That jib is not tied down the way it should be, and it will not be, ' +
            'because we do not have the chain.',
        ]},
        { who:'you', choices:[
            { text:'"Tell Hal we\'re rolling in twenty minutes."',
              reply:{ who:'hal', lines:[
                  '*Down the line, the sound of a man putting a hand over the mouthpiece and telling somebody something.*',
                  'Twenty minutes. Understood. I will hold every path on the district for you.',
                  '*And then, in a voice you have not heard him use:* Thank you.',
              ]}, effect:{ rep:6, goodwill:4 } },
            { text:'"What does Continental Pacific pay for this?"',
              reply:{ who:'hal', lines:[
                  'Standard mutual assistance rate. It will not cover your fuel.',
                  '*Evenly.* I am aware of what I am asking. It is why I said I have never asked.',
              ]}, effect:{ money:900, flag:'asked-the-rate' } },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Vandalur Gate — the wreck train',
        orders: 'The crane, the tool van and everything Meera could throw in. Heavy, slow and top-heavy. ' +
                'Get down to the derailment without making a second one.',
        from:'marrow', to:'vandalur', loco:'wdm2',
        cars:['crane','tool','caboose'],
        rescue: true,
        hour: 2.6, weather:'clear', adhesion:'dry', ambient: 14,
        night: true,
        schedule: 620, hardLimit: 880,
        shockLimit: 0.6,
        traffic:[],
        hazards:[
            { type:'crossing', s:2300 },
            { type:'rockfall', s:3820 },
        ],
        radio:[
            { atS: 200,  who:'dell',  text:'Ninety-six tonnes of crane behind you and a jib that wants to be somewhere else. Everything slowly.' },
            { atS: 2600, who:'radio', text:'9X, every signal from here to Vandalur is off for you. Nobody is moving on this district tonight but you.' },
            { atS: 3300, who:'meera', text:'Lights ahead. That is them. Get us stopped short and we will walk in.' },
        ],
        objectives:[
            { id:'arrive',   text:'Reach the derailment at Vandalur' },
            { id:'nostrike', text:'Stop short of the wreckage' },
            { id:'shock',    text:'Keep the crane on its wheels — nothing above 0.6g' },
        ],
        pay: 1400,
    },

    closing: [
        { who:'narrator', lines:[
            '*It takes until nine in the morning. Meera works the crane because Meera is the only person who ' +
            'read the manual, in 1996, for fun.*',
            '*Continental Pacific sends two fitters, four sandwiches and a photographer.*',
        ]},
        { who:'hal', lines:[
            'The district reopened at 09:40. My superiors would like to know which contractor performed the recovery.',
            'I have written: Sable Valley Railway. I have written it in the box that is meant for Class One operators, ' +
            'and I have not corrected it.',
        ]},
    ],
},

/* ══ 11 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-muhurtham',
    title: 'The Muhurtham',
    subtitle: 'Coldspring — minus fourteen, and the pass is shut',
    epigraph: 'A wedding does not move because the railway is late. The hour was chosen months ago ' +
              'by people who did not consult the weather.',

    opening: [
        { who:'dhanam', lines:[
            'Kestrel Gap. The whole party. Bride, both families, the priest, and a drum that has already ' +
            'been dropped once.',
            'Muhurtham is eleven forty. Not eleven fifty. Eleven forty is the hour, and if the hour passes ' +
            'they will still be married but nobody in either family will ever stop talking about it.',
        ]},
        { who:'meera', lines:[
            'Minus fourteen and snowing since two. Snow on the rail is almost no adhesion at all — he will spin ' +
            'the moment you ask for more than he can put down.',
            'Sand early. Sand before the grade. And if he slips at this weight on that hill you will not get him back.',
        ]},
        { who:'dell', lines:[
            'And smooth. Smooth is the whole job today. There is a woman in that saloon wearing nine yards of silk ' +
            'and about four kilos of gold and she has been awake since three.',
        ]},
        { who:'you', choices:[
            { text:'"Then we go early and we go slow. Give me an extra half hour."',
              reply:{ who:'dhanam', lines:[
                  'Already done. I told them the train leaves at nine. It leaves at nine forty.',
                  '*Serenely.* Forty years, kanna. I know what a wedding party is.',
              ]}, effect:{ goodwill:3, flag:'dhanam-margin' } },
            { text:'"Can the road take them? Even part way?"',
              reply:{ who:'meera', lines:[
                  'The pass shut at four this morning and it will not open before Thursday.',
                  'It is us or it is a different day, and a different day is not available.',
              ]}, effect:{} },
        ]},
    ],

    run: {
        title: 'Coldspring → Kestrel Gap — the wedding special',
        orders: 'The wedding saloon and both families to the Gap before the muhurtham. ' +
                'Snow on the rail. Sand early, drive smoothly, and do not be late.',
        from:'coldspring', to:'kestrel', loco:'wdm2',
        cars:['wedding','coach','combine','caboose'],
        hour: 9.7, weather:'snow', adhesion:'snow', ambient: -14,
        schedule: 380, hardLimit: 520,
        shockLimit: 0.55,
        traffic:[],
        hazards:[ { type:'crossing', s:2400 }, { type:'drift', s:1750 } ],
        radio:[
            { atS: 150,  who:'meera', text:'Sand on before the grade. Not when he spins — before.' },
            { atS: 1600, who:'dell',  text:'Drift across the cutting ahead. Keep your speed up through it or you will stop in it.' },
            { atS: 2600, who:'dhanam',text:'The drum has started. In the saloon. At twenty-two miles an hour. I am not going to stop them.' },
            { atS: 3200, who:'dell',  text:'*Half a laugh.* The whole train is clapping in time. Keep it smooth — they will feel every notch.' },
        ],
        objectives:[
            { id:'arrive', text:'Reach Kestrel Gap' },
            { id:'ontime', text:'Before the muhurtham' },
            { id:'shock',  text:'Smooth enough for nine yards of silk' },
            { id:'nostall',text:'Do not stall in the snow' },
        ],
        pay: 300,
    },

    closing: [
        { who:'narrator', lines:[
            '*Eleven twenty-six. The platform at Kestrel Gap has been swept by somebody, and there is a kolam ' +
            'drawn on it in rice flour that the snow is already taking back.*',
        ]},
        { who:'dhanam', lines:[
            'Fourteen minutes to spare.',
            '*She is crying and would deny it under oath.*',
            'Her mother asked me who the driver was. I said: the railway. She said: no, who. ' +
            'I said: the railway, amma. It is always the railway.',
        ]},
    ],
},

/* ══ 12 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'diesel-heart',
    title: 'Diesel Heart',
    subtitle: 'Coldspring — 03:20',
    epigraph: 'Dhuk. Dhuk. Dhuk. Six hundred and eighty litres of displacement at idle, ' +
              'shaking the floor of a shed in a valley nobody drives to.',

    opening: [
        { who:'meera', lines:[
            'Dell had a cardiac event at eleven o\'clock last night.',
            'He is stable. He is in Coldspring clinic, and Ivy says he needs to be in a cardiac unit at Halloway ' +
            'by six or she is not going to be able to promise anything.',
            'The helicopter is grounded. The road is the road.',
        ]},
        { who:'ivy', lines:[
            'Smoothly. Not fast — smoothly. Every jolt is a risk I cannot quantify and do not want to.',
            'Bring the medical van. I will ride with him.',
        ]},
        { who:'corinne', lines:[
            '*On the line from Baden, at four in the morning her time.*',
            'The ABB device is in your shed. It goes to Halloway on the eleven o\'clock either way, ' +
            'and there is no second train.',
            'I know what else you are carrying. Put it on the same train. It has sat in a shed for two years ' +
            'waiting to be the future of your railway — it can take one more trip on the back of the present one.',
        ]},
        { who:'meera', lines:[
            'Velaikkaran has a cracked head on cylinder four. I found it at midnight.',
            'I can run him. He will make maybe seventy percent and run hot the whole way and I do not know — ' +
            'genuinely, I do not know — whether he finishes.',
            '*She is not crying. She is furious, which is what she does instead.*',
            'Forty-one years Dell drove that engine.',
        ]},
        { who:'you', choices:[
            { text:'"Then he takes him. Start him up."',
              reply:{ who:'meera', lines:[
                  '*She hits the start. The valley hears it — three in the morning and every light in Coldspring comes on.*',
                  'Dhuk. Dhuk. Dhuk.',
                  'Seri, thambi. Innoru vaati. One more time.',
              ]}, effect:{ rep:3, goodwill:2 } },
            { text:'"Get Gundu. He\'s slow but he will not fail."',
              reply:{ who:'meera', lines:[
                  'Gundu does forty-five and cannot hold the downgrade with a load. That is twenty minutes ' +
                  'we do not have.',
                  '*Then:* But he will get there. It is the safer call and I will not argue with you for making it.',
              ]}, effect:{ flag:'took-gundu' } },
        ]},
        { who:'narrator', lines:[
            '*Tomas is standing at the fence in the dark, in the coat that still does not fit him.*',
            '*He does not ask to come. He opens the gate, and he holds it, and he stands back.*',
        ]},
    ],

    run: {
        title: 'Coldspring → Halloway Junction',
        orders: 'Odell Bray to the cardiac unit at Halloway. The ABB device on the same train, because there is ' +
                'no other train. Seventy percent power, running hot the whole way, and smoothly.',
        from:'coldspring', to:'halloway', loco:'wdm2',
        cars:['medical','abb','combine'],
        hour: 3.6, weather:'clear', adhesion:'dry', ambient: 26,
        night: true,
        schedule: 1800, hardLimit: 2150,
        shockLimit: 0.52,
        cracked: { powerScale: 0.7, heatBias: 22 },
        traffic:[
            { id:'cp-14', name:'CP 14 tank train', dir:-1, s:8600, v:0, cruise:16, kind:'freight', cars:11, releaseAt: 60 },
        ],
        meets:[ { trainId:'cp-14', siding:'Wilder siding' } ],
        hazards:[ { type:'crossing', s:1100 }, { type:'crossing', s:5200 }, { type:'crossing', s:8900 } ],
        radio:[
            { atS: 60,    who:'radio', text:'Sable Valley 9X — Halloway. Every signal on this railroad is green for you. Every one. Run.' },
            { atS: 2200,  who:'meera', text:'Water temperature ninety-one and climbing. Do not chase the speed. He gives you what he has.' },
            { atS: 5200,  who:'ivy',   text:'He is awake. He says — *she stops* — he says you are braking too early. He says that is the correct fault to have.' },
            { atS: 8200,  who:'radio', text:'9X, CP 14 has been put into Wilder for you. He is a tank train and he does not move for anybody, and he moved.' },
            { atS: 11200, who:'meera', text:'Two miles. He is hot, he is down to five cylinders, and he is still pulling. *Quietly.* Vaa da. Come on. Come on, my boy.' },
        ],
        objectives:[
            { id:'arrive', text:'Reach Halloway Junction' },
            { id:'shock',  text:'Smooth — nothing above 0.52g' },
            { id:'abb',    text:'The ABB device unshaken' },
            { id:'ontime', text:'Before six o\'clock' },
        ],
        pay: 0,
    },

    closing: [
        { who:'ivy', lines:[
            'They took him straight through. He talked the entire way and I have never wanted anyone to shut up ' +
            'so badly in my life.',
        ]},
        { who:'meera', lines:[
            '*The engine is ticking as it cools. Steam is coming off the hood in the dark.*',
            'Cylinder four is finished. Head cracked right through the water jacket. He was on five for the ' +
            'last three miles.',
            'He knew. I am aware that is not a thing engines do. He knew.',
        ]},
        { who:'corinne', lines:[
            'The device logged the entire journey. Peak event, well inside tolerance.',
            'I am recommending Baden site the converter trial here. On your line. With your gradient and your ' +
            'weather and your ninety-seven-year-old tank engine two hundred metres away in a shed.',
            'Somebody asked me why. I said: because they got it here without shaking it, on the night they had ' +
            'every reason to.',
        ]},
        { who:'narrator', lines:[
            '*Sunrise at Halloway Junction. The valley behind you, twelve miles of it, climbing.*',
            '*Somewhere up there a mill is opening, a clinic is unlocking its doors, and a boy is walking down ' +
            'to a fence.*',
            '*The engine idles. Dhuk. Dhuk. Dhuk.*',
            '*The load needs pulling.*',
        ]},
    ],

    finale: true,
},
];

export function chapterById(id) { return CHAPTERS.find(c => c.id === id); }
