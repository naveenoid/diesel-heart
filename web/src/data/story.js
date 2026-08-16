/* ── The campaign ─────────────────────────────────────────────────────────────
   Ten chapters. Each is: some people talking, a run, and the consequences of
   how you drove it.

   Dialogue beats are `{ who, role, lines, choices? }`. A line beginning with
   '*' is a stage direction and gets set in italics. Choices carry an `effect`
   the campaign applies, and a `reply` the scene plays before moving on.

   Run scenarios are consumed by game/run.js — see the shape notes there. */

export const CHARACTERS = {
    meera:   { name: 'Meera Rao',        role: 'Chief mechanic' },
    dell:    { name: 'Odell Bray',       role: 'Engineer, forty-one years' },
    hal:     { name: 'Halvard Ines',     role: 'Continental Pacific — chief dispatcher' },
    ivy:     { name: 'Dr Ivy Serrano',   role: 'Coldspring clinic' },
    tomas:   { name: 'Tomas Weir',       role: 'Fourteen, and at the fence again' },
    corinne: { name: 'Corinne Vance',    role: 'Peregrine Instruments — logistics' },
    nadia:   { name: 'Nadia Okonkwo',    role: 'Tannery Flats mill' },
    you:     { name: 'You',              role: 'Whoever is left to do it' },
    radio:   { name: 'Radio',            role: 'Channel 2 — Halloway dispatch' },
    narrator:{ name: '',                 role: '' },
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
            '*The enginehouse smells of diesel, cold iron and the coffee Meera made at two in the morning and forgot.*',
            '*Painted above the doors, in letters somebody repaints every spring:*  **THE LOAD NEEDS PULLING.**',
        ]},
        { who:'meera', lines:[
            'She turned over on the third try. That is better than Tuesday.',
            'I am not going to pretend this is a good week to learn. But seventeen does not care what kind of week it is, and neither does the mill.',
        ]},
        { who:'dell', lines:[
            'Abel drove her forty years. You are going to drive her badly for a while. That is allowed.',
            'Just remember the one thing. She weighs two hundred and sixty tons and she does not stop because you would like her to.',
        ]},
        { who:'you', choices:[
            { text:'"What did he tell you, the first time you took her out?"',
              reply:{ who:'dell', lines:[
                  'He said: look further ahead than feels sensible. Then look further than that.',
                  '*He laughs, then does not.* He also said the coffee was undrinkable. He was right about both.',
              ]}, effect:{ rep:1 } },
            { text:'"Then let\'s not keep the mill waiting."',
              reply:{ who:'meera', lines:[
                  'Good. Brake pipe is charged, you have eight hundred litres, and the cooling group is honest today.',
                  'Take her gently down to Halloway. Gently.',
              ]}, effect:{ } },
            { text:'"I don\'t think I can do this."',
              reply:{ who:'meera', lines:[
                  '*She wipes her hands on a rag that has not been clean since the nineties.*',
                  'No. Probably not. Do it anyway — that is the entire job.',
              ]}, effect:{ morale:{ crew:1 } } },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Halloway Junction',
        orders: 'Three loads of mill product to the interchange. Downgrade the whole way. ' +
                'Be on the interchange track by 05:10 or Continental Pacific gives your slot away.',
        from:'marrow', to:'halloway', loco:'wdm2',
        cars:['boxcar','boxcar','caboose'],
        hour: 4.35, weather:'clear', adhesion:'dry', ambient: 24,
        schedule: 305, hardLimit: 470,
        traffic: [], hazards: [],
        tutorial: true,
        radio:[
            { atS: 60,   who:'dell',  text:'Notch up steady. One at a time — she is not a car.' },
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
        pay: 1400,
    },

    closing: [
        { who:'dell', lines:[
            'That will do. That will do fine.',
            'You will get the stopping. Everybody starts by stopping too late and then spends a month stopping too early.',
        ]},
        { who:'meera', lines:[
            'Fuel bill for that trip: two hundred and change. The mill pays fourteen hundred.',
            'Which sounds like a railway until you see what a traction motor costs.',
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
            'I have eleven Continental Pacific movements through this junction between six and ten. You are a twelve mile short line with four locomotives, one of which is from 1928.',
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
                  'Abel got 04:40 for thirty-one years and never once complained about it, which I always thought was a failure of imagination on his part.',
                  '*Almost warmly.* He also never took a red. Not one, in thirty-one years. Beat that and the conversation changes.',
              ]}, effect:{ flag:'hal-abel' } },
        ]},
        { who:'dell', lines:[
            'Signals from here on. Green, you run. Yellow, you get ready to stop at the next one. Red, you stop — before it, not level with it.',
            'A red passed is a SPAD, and a SPAD is how a short line stops being a railway.',
        ]},
    ],

    run: {
        title: 'Halloway Junction → Tannery Flats',
        orders: 'Empties up the valley to the mill, plus the valley\'s mail in the combine. ' +
                'Continental Pacific has a coal train working ahead of you. Obey your signals.',
        from:'halloway', to:'tannery', loco:'wdm2',
        cars:['combine','boxcar','hopper','hopper','caboose'],
        hour: 4.7, weather:'clear', adhesion:'dry', ambient: 22,
        schedule: 620, hardLimit: 850,
        traffic:[
            { id:'cp-441', name:'CP 441 coal', dir:1, s:2400, v:7.5, cruise:8.5, kind:'freight', cars:9,
              takesSiding:'Wilder siding' },
        ],
        hazards:[
            { type:'crossing', s:4600 },
        ],
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
        pay: 1750,
    },

    closing: [
        { who:'nadia', lines:[
            'Mail\'s three days late and that is not your fault, it is the road.',
            'Two hundred and six people still work in that building behind me. Every one of them gets here because you get here.',
        ]},
    ],
},

/* ══ 3 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'sabre-hill',
    title: 'Sabre Hill',
    subtitle: 'Tannery Flats — 09:15',
    epigraph: 'Two point two percent for a mile and a half. Everything this railway is, it is because of that hill.',

    opening: [
        { who:'meera', lines:[
            'The mill has twelve cars ready. Nine hundred tons if you take the lot, and Sabre Hill in the middle of it.',
            'How much of it you couple to is your decision. Everything you leave behind sits there another week.',
            'Here is what will happen. You will hold notch eight because you want the speed, and the water temperature will climb, and at ninety-two degrees she will pull her own power back to save herself.',
            'And then you will be doing eight miles an hour halfway up a hill with nine hundred tons pushing you back down it.',
        ]},
        { who:'dell', lines:[
            'The trick is you decide before the hill, not on it. Get your speed at the bottom and spend it climbing.',
            'Notch seven all the way up is faster than notch eight for forty seconds and notch four for four minutes. That is the whole of it.',
        ]},
        { who:'you', choices:[
            { text:'"Can we cut the train? Two trips?"',
              reply:{ who:'meera', lines:[
                  'Two trips is two slots and we have one. It is one train or it is next week.',
              ]}, effect:{} },
            { text:'"What happens if she stalls on the grade?"',
              reply:{ who:'dell', lines:[
                  'Then you hold what you have with the air, and you back her down to Tannery, and you try again with a lighter train and a worse reputation.',
                  'It has happened to me twice. I remember both.',
              ]}, effect:{ flag:'stall-warned' } },
        ]},
    ],

    run: {
        title: 'Tannery Flats → Coldspring',
        orders: 'As much of the mill\'s backlog as you dare take over Sabre Hill. ' +
                'Watch the water temperature. Speed restriction of 25 through the Sabre curves — ' +
                'the hill will not let you go faster anyway.',
        from:'tannery', to:'coldspring', loco:'wdm2',
        cars:['hopper','hopper','hopper','boxcar','tank','caboose'],
        optional:['hopper','hopper','boxcar','gondola','flat','flat'],
        maxCars: 12,
        hour: 9.4, weather:'clear', adhesion:'dry', ambient: 31,
        schedule: 1450, hardLimit: 1800,
        traffic:[],
        hazards:[ { type:'crossing', s:1300 }, { type:'crossing', s:5400 } ],
        radio:[
            { atS: 400,  who:'dell',  text:'Grade starts at the mill throat. Build what you can now — you will not build it later.' },
            { atS: 2400, who:'dell',  text:'This is it. Sabre. Watch that temperature gauge like it owes you money.' },
            { atS: 4200, who:'meera', text:'If she derates, back off two notches and let her breathe. She will come back. She always comes back.' },
            { atS: 5200, who:'dell',  text:'Summit board. Now it is a different problem — nine hundred tons wanting to get to Coldspring before you do.' },
        ],
        objectives:[
            { id:'arrive',   text:'Stop at Coldspring' },
            { id:'noderate', text:'Do not cook the engine' },
            { id:'nostall',  text:'Do not stall on the grade' },
        ],
        pay: 2600,
    },

    closing: [
        { who:'meera', lines:[
            'Water temperature peaked and came back down. Cooling group is honest, prime mover is tired.',
            '*She writes something on the whiteboard and underlines it.* We are going to need a radiator core before winter. I do not know where from yet.',
        ]},
        { who:'dell', lines:[
            'You heard her change note on the last quarter mile? That flat sound?',
            'That is her working. That is the best noise there is.',
        ]},
    ],
},

/* ══ 4 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'what-coldspring-needs',
    title: 'What Coldspring Needs',
    subtitle: 'Marrow Bend platform — 05:50, raining',
    epigraph: 'The road to Coldspring washed out on the fourteenth. It washes out every spring. ' +
              'This year the clinic did not have a month of stock in hand.',

    opening: [
        { who:'ivy', lines:[
            'I have oxygen for two days. I have a woman in her thirty-eighth week who should not be having this baby in Coldspring and cannot get out of Coldspring.',
            'The van is loaded. It is on your platform. I am not going to tell you how to drive.',
        ]},
        { who:'meera', lines:[
            'Rain since midnight. The rail will be greasy through the cut and you will slip if you snatch at it.',
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
              ]}, effect:{ morale:{ marrow:2 }, flag:'tomas-ride' } },
            { text:'"Watch from the platform, Tomas. Not today."',
              reply:{ who:'tomas', lines:[
                  'Okay. *He does not move from the fence.* Okay.',
              ]}, effect:{} },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Coldspring',
        orders: 'Medical van and stores to Coldspring. Rain — reduced adhesion. ' +
                'The van is fragile: heavy braking will cost you glass and pressure vessels.',
        from:'marrow', to:'coldspring', loco:'wdm2',
        cars:['medical','boxcar','reefer','combine','caboose'],
        hour: 5.9, weather:'rain', adhesion:'wet', ambient: 18,
        schedule: 1300, hardLimit: 1650,
        traffic:[
            { id:'cp-208', name:'CP 208 manifest', dir:-1, s:9200, v:0, cruise:19, kind:'freight', cars:8, releaseAt: 40 },
        ],
        meets:[ { trainId:'cp-208', siding:'Sabre siding' } ],
        hazards:[ { type:'crossing', s:1400 }, { type:'crossing', s:9200 } ],
        radio:[
            { atS: 300,  who:'radio', text:'9X, Halloway. CP 208 is westbound out of Kestrel Gap, running against you. You will take Sabre siding for the meet.' },
            { atS: 3000, who:'dell',  text:'Sabre siding is the one on the hill. Getting in is easy. Getting out again on a wet 2.2 percent is the part nobody enjoys.' },
            { atS: 6900, who:'radio', text:'9X, 208 is clear. Main is yours to Coldspring.' },
        ],
        objectives:[
            { id:'arrive', text:'Stop at Coldspring' },
            { id:'cargo',  text:'Medical van intact' },
            { id:'meet',   text:'Clear the main for CP 208' },
        ],
        pay: 1900,
    },

    closing: [
        { who:'ivy', lines:[
            'Cylinders are intact. All six.',
            '*She is already walking away with a trolley.* Her name is going to be Wren. I asked. I do not usually ask.',
        ]},
        { who:'dell', lines:[
            'There it is. That is the reason. Everything else is arithmetic.',
        ]},
    ],
},

/* ══ 5 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'jugaad',
    title: 'Jugaad',
    subtitle: 'Marrow Bend enginehouse — Sunday',
    epigraph: '"There is a correct repair and there is a repair that runs on Monday. ' +
              'I have been doing the second one since I was nineteen." — Meera Rao',

    opening: [
        { who:'meera', lines:[
            'Number three traction motor. The armature is scored and there is no rewind shop within four hundred miles that will look at a WDM-2.',
            'A new motor is eleven thousand and eight weeks. We do not have either.',
            'So: I isolate three, we run on five motors, and I shim the brush gear on two so it stops arcing. It will hold if you are gentle.',
        ]},
        { who:'you', choices:[
            { text:'"Do it. We\'ll drive around the weakness."',
              reply:{ who:'meera', lines:[
                  'Yes. And "gentle" means no wheelslip. Not one. Every slip puts current where I have asked it not to go.',
                  'Sand early. Notch up slow. Pretend the throttle is made of glass.',
              ]}, effect:{ flag:'bodge-traction' } },
            { text:'"What if we borrow against next month and buy the motor?"',
              reply:{ who:'meera', lines:[
                  '*She looks at you for a long moment.*',
                  'Then we are correct, and solvent, and not running in eight weeks\' time. Abel borrowed once. It took him six years to stop.',
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
        orders: 'Fuel and stores to the Gap on five traction motors — take only what you must. ' +
                'Wheelslip will damage the bodged motor — and if it lets go on the hill, you finish the trip on whatever is left.',
        from:'marrow', to:'kestrel', loco:'wdm2',
        cars:['tank','tank','caboose'],
        optional:['boxcar','flat','hopper','reefer'],
        maxCars: 8,
        hour: 7.2, weather:'clear', adhesion:'dry', ambient: 28,
        schedule: 1150, hardLimit: 1550,
        bodge: { component:'traction', failChance: 0.55, slipSensitive: true },
        traffic:[],
        hazards:[ { type:'crossing', s:1400 }, { type:'crossing', s:9200 }, { type:'crossing', s:12700 } ],
        radio:[
            { atS: 100,  who:'meera', text:'Gentle. Notch two, wait, notch three. If she slips I will hear it from here.' },
            { atS: 5000, who:'dell',  text:'Sabre. Sand it before the grade bites, not when you are already spinning.' },
            { atS: 11000,who:'dell',  text:'Over the top. Now nurse her home.' },
        ],
        objectives:[
            { id:'arrive',   text:'Reach Kestrel Gap' },
            { id:'noslip',   text:'Keep the bodged motor alive' },
        ],
        pay: 2200,
    },

    closing: [
        { who:'meera', lines:[
            '*She has the inspection cover off before the engine has stopped turning.*',
            'Brush gear is warm but it is not blue. Warm I can live with. Blue means we start again.',
            'That shim is going to outlive this railway. Do not tell anyone I said that.',
        ]},
    ],
},

/* ══ 6 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'peregrine',
    title: 'Peregrine',
    subtitle: 'Ostrand — the lab road',
    epigraph: 'The money that keeps the lights on does not come from the people who need us. ' +
              'It never does.',

    opening: [
        { who:'corinne', lines:[
            'Two dewars of liquid helium and an interferometer that was calibrated in Zurich. The flat car is shock-logged end to end.',
            'Peregrine pays eleven thousand for delivery to Halloway. Peregrine pays nothing at all if the log shows an event above 0.7g.',
            'I am told your locomotive is fifty-six years old.',
        ]},
        { who:'you', choices:[
            { text:'"She is. She has also never dropped a load."',
              reply:{ who:'corinne', lines:[
                  '*She writes that down, which is somehow worse than if she had argued.*',
                  'Then we will both find out whether that is a record or a run of luck.',
              ]}, effect:{ rep:1 } },
            { text:'"Eleven is low for a shock-logged move on a mountain grade. Fifteen."',
              reply:{ who:'corinne', lines:[
                  'Thirteen. And I will note that you knew to ask, which is more than the last three carriers did.',
              ]}, effect:{ money:2000, rep:1 } },
            { text:'"Why us? You could truck it."',
              reply:{ who:'corinne', lines:[
                  'The road has eleven switchbacks and a nine percent descent. A truck is one driver\'s bad afternoon away from a very expensive crater.',
                  'You have a hill and brakes and a person who has done it before. That is the entire pitch.',
              ]}, effect:{ flag:'corinne-why' } },
        ]},
        { who:'dell', lines:[
            'Pip brought it down off the lab road overnight and left it in the Coldspring loop. Two miles an hour the whole way, and he still sweated through his shirt.',
            'Shock log means no snatching. Ease the brake on, ease it off. Every time you change something, change it slowly.',
            'The train talks to itself through the couplers. What you feel in the seat, that glass feels four times over.',
        ]},
    ],

    run: {
        title: 'Coldspring → Halloway Junction',
        orders: 'Peregrine cryo flat to the interchange. Descending grade nearly all the way. ' +
                'Keep the shock meter out of the red — every spike costs the contract.',
        from:'coldspring', to:'halloway', loco:'wdm2',
        cars:['cryo','flat','boxcar','caboose'],
        hour: 13.1, weather:'clear', adhesion:'dry', ambient: 33,
        schedule: 1000, hardLimit: 1400,
        shockLimit: 0.7,
        traffic:[
            { id:'cp-77', name:'CP 77 intermodal', dir:-1, s:11800, v:0, cruise:24, kind:'express', cars:7, releaseAt: 120 },
        ],
        meets:[ { trainId:'cp-77', siding:'Wilder siding' } ],
        hazards:[ { type:'crossing', s:1100 }, { type:'crossing', s:5200 }, { type:'crossing', s:8900 } ],
        radio:[
            { atS: 400,   who:'dell',   text:'All downhill from here in every sense. Dynamic brake is your friend — it never snatches.' },
            { atS: 4200,  who:'radio',  text:'9X, Halloway. CP 77 intermodal is running against you, doing fifty-five. You will clear at Wilder.' },
            { atS: 6900,  who:'dell',   text:'Wilder siding ahead. Be inside it and stopped before he is on top of you.' },
        ],
        objectives:[
            { id:'arrive', text:'Deliver to Halloway Junction' },
            { id:'shock',  text:'No shock event above 0.7g' },
            { id:'limits', text:'Observe every speed restriction' },
            { id:'meet',   text:'Clear the main for CP 77' },
        ],
        pay: 11000,
    },

    closing: [
        { who:'corinne', lines:[
            'Peak recorded event: I will not read it out, because you already know what it was.',
            'Peregrine ships twice a month. I am putting Sable Valley on the standing list.',
        ]},
        { who:'meera', lines:[
            'Eleven thousand.',
            '*She sits down on the step of the enginehouse, which she never does.*',
            'That is the radiator core. That is the radiator core and a spare injector and the boy\'s boots.',
        ]},
    ],
},

/* ══ 7 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-cut',
    title: 'The Cut',
    subtitle: 'Sabre cut — 23:40, fog',
    epigraph: 'The rock above the Sabre cut has been coming down in its own time since before there was a railway under it.',

    opening: [
        { who:'radio', lines:[
            'Sable Valley 9X, Halloway. We have a report of debris on the line in the Sabre cut. Track walker cannot get up there before morning.',
            'Continental Pacific is not running the valley tonight. Whether you run it is your decision and your liability.',
        ]},
        { who:'ivy', lines:[
            'I have a man with a compound fracture and a helicopter that cannot fly in this.',
            'If you can get to Coldspring I can get him to Halloway and Halloway can get him to a surgeon.',
        ]},
        { who:'meera', lines:[
            'Fog, night, and a rock cut. Your headlight will show you maybe two hundred metres and you need four hundred to stop from forty.',
            'So you do not do forty. You do what you can stop inside of. That is not caution, it is arithmetic.',
        ]},
        { who:'you', choices:[
            { text:'"We go. Slow, lit up, and ready for it."',
              reply:{ who:'dell', lines:[
                  '*He is already pulling his coat on.*',
                  'I will ride the point with a lamp. Two sets of eyes is worth ten miles an hour.',
              ]}, effect:{ rep:2, morale:{ coldspring:2 } } },
            { text:'"Not in fog. Not at night. First light."',
              reply:{ who:'ivy', lines:[
                  '*A long silence on an open channel.*',
                  'That is a defensible decision. I want you to know that I understand it.',
                  'I will call you at four.',
              ]}, effect:{ flag:'declined-night', morale:{ coldspring:-2 } } },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Coldspring',
        orders: 'Night. Fog. Sighting distance is under two hundred metres. ' +
                'There is debris somewhere in the Sabre cut and nobody knows exactly where.',
        from:'marrow', to:'coldspring', loco:'wdm2',
        cars:['medical','combine','caboose'],
        hour: 23.7, weather:'fog', adhesion:'wet', ambient: 9,
        night: true,
        schedule: 1150, hardLimit: 1600,
        traffic:[],
        hazards:[
            { type:'crossing', s:1400 },
            { type:'rockfall', s:6520 },
        ],
        radio:[
            { atS: 200,  who:'dell',  text:'Cannot see the whistle boards in this. I will call them.' },
            { atS: 4800, who:'dell',  text:'Cut in about a mile. Get her down now — I want to be crawling before we are in it, not slowing down inside it.' },
            { atS: 7400, who:'dell',  text:'*Quietly.* Clear. Clear and running. Take her to Coldspring.' },
        ],
        objectives:[
            { id:'arrive',    text:'Reach Coldspring' },
            { id:'nostrike',  text:'Do not strike the debris' },
        ],
        pay: 1200,
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

/* ══ 8 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'cold-snap',
    title: 'Cold Snap',
    subtitle: 'Marrow Bend — minus nineteen',
    epigraph: 'The fuel truck did not come. The fuel truck did not come because the pass is closed, ' +
              'and the pass is closed because it is winter, and we are the reason winter is survivable here.',

    opening: [
        { who:'meera', lines:[
            'Ninety litres in seventeen. That is enough to move her around the yard and feel sorry for ourselves.',
            'But there is four tons of coal in the bunker behind the shed, and there is a Swiss tank engine from 1928 that does not care what the fuel market is doing.',
        ]},
        { who:'dell', lines:[
            'Grossmutter. God help us.',
            'Four hundred horsepower, thirty miles an hour flat out, and a boiler that will let you down the moment you get greedy with the regulator.',
        ]},
        { who:'meera', lines:[
            'Here is how she drives, and it is nothing like seventeen.',
            'Pressure is a bank account. Open the regulator wide and you spend it faster than the fire makes it. Shut off and it comes back.',
            'So you run her in pulses. Pull, ease, let her breathe, pull again. Get it wrong and you will be sitting in a snowdrift with no steam and a very cold night ahead.',
        ]},
        { who:'tomas', lines:[
            'I cleaned the fire. Meera showed me. I did the whole thing myself.',
            '*He is grey with ash and visibly the happiest anyone has been all winter.*',
            'Can I come? I can shovel. I am good at it now, honestly.',
        ]},
        { who:'you', choices:[
            { text:'"Get in. Mind the injector and do what Meera tells you."',
              reply:{ who:'tomas', lines:[
                  '*He is up the steps before you finish the sentence.*',
              ]}, effect:{ morale:{ marrow:3 }, flag:'tomas-fires' } },
            { text:'"Minus nineteen and a snow run. Next time, and I mean it."',
              reply:{ who:'tomas', lines:[
                  'You always say next time.',
                  '*Then, fairly:* But you have never once not meant it. Okay.',
              ]}, effect:{} },
        ]},
    ],

    run: {
        title: 'Marrow Bend → Tannery Flats',
        orders: 'Coal, heating oil and food to the mill town on the steam locomotive. ' +
                'Snow on the rail — adhesion is close to nothing. Manage boiler pressure or stall.',
        from:'marrow', to:'tannery', loco:'e33',
        cars:['boxcar','tank','combine'],
        optional:['boxcar','hopper'],
        maxCars: 5,
        hour: 6.8, weather:'snow', adhesion:'snow', ambient: -19,
        schedule: 900, hardLimit: 1250,
        traffic:[],
        hazards:[ { type:'crossing', s:1400 }, { type:'drift', s:2600 } ],
        radio:[
            { atS: 80,   who:'meera', text:'Regulator half. Half. She will make more speed on half than on full, because on full she runs out of steam.' },
            { atS: 1600, who:'dell',  text:'Snow on the rail. Sand it and be patient — if she slips at this weight you will not get her back.' },
            { atS: 3000, who:'meera', text:'Pressure is down to fifty. Shut off, let her make it back. The hill is not going anywhere.' },
        ],
        objectives:[
            { id:'arrive',  text:'Reach Tannery Flats' },
            { id:'nostall', text:'Do not run out of steam on the grade' },
        ],
        pay: 1500,
    },

    closing: [
        { who:'nadia', lines:[
            'Mill was going to send everyone home at noon. No oil, no heat, no shift.',
            '*She looks at the little green tank engine ticking as it cools.*',
            'Two hundred and six people. By that.',
        ]},
        { who:'dell', lines:[
            'Nineteen twenty-eight. She was built to shunt a goods yard outside Winterthur for forty years and then be scrapped.',
            'Instead she is here, in the snow, keeping a mill open on the other side of the world. I think about that more than is reasonable.',
        ]},
    ],
},

/* ══ 9 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'the-ledger',
    title: 'Hal\'s Ledger',
    subtitle: 'Halloway Junction — the interchange agreement',
    epigraph: 'Nobody closes a railway. They simply stop finding room for it.',

    opening: [
        { who:'hal', lines:[
            'This is not a threat and I would like you to hear it as what it is.',
            'Continental Pacific is rationalising interchanges. Yours moves eleven cars a day. The threshold is twenty-five.',
            'I have been asked to produce a recommendation by the end of the month.',
        ]},
        { who:'you', choices:[
            { text:'"Then tell me what a recommendation to keep us looks like."',
              reply:{ who:'hal', lines:[
                  'It looks like a railway that hits its slot every day for a month with no incidents, and moves enough tonnage that the number stops being embarrassing.',
                  'You have one slot left this month and a great deal of tonnage to move in it.',
                  'I did not choose the threshold. I did choose to call you before I wrote anything.',
              ]}, effect:{ rep:2 } },
            { text:'"Eleven cars a day is four hundred people who have no other road."',
              reply:{ who:'hal', lines:[
                  'I know exactly how many people it is. I grew up in Kestrel Gap.',
                  '*A pause.* Which is not an argument that survives a spreadsheet. Give me a number I can put next to the sentiment.',
              ]}, effect:{ flag:'hal-kestrel', rep:1 } },
            { text:'"Abel would have known what to say to you."',
              reply:{ who:'hal', lines:[
                  'Abel would have said nothing at all and simply run the train, and I would have had to explain to my superiors why the tonnage moved itself.',
                  '*Almost gently.* Do that. That is what I am asking you to do.',
              ]}, effect:{ flag:'hal-abel2' } },
        ]},
        { who:'meera', lines:[
            'Everything we own, in one train. Seventeen on the point.',
            'Seven hundred tons, the whole valley\'s month, and every mile of it downhill into the slot.',
            'The cooling group has a core I fitted in October and a prayer I said over it.',
        ]},
    ],

    run: {
        title: 'Coldspring → Halloway Junction',
        orders: 'The heaviest train Sable Valley has ever run. Continental Pacific counts cars, ' +
                'so every one you leave on the team track is a number Hal has to explain away. ' +
                'They are watching the tape.',
        from:'coldspring', to:'halloway', loco:'wdm2',
        cars:['cryo','reefer','combine','caboose'],
        optional:['boxcar','boxcar','hopper','hopper','gondola','tank','flat','reefer'],
        maxCars: 13,
        hour: 15.4, weather:'clear', adhesion:'dry', ambient: 39,
        schedule: 1500, hardLimit: 1900,
        shockLimit: 0.72,
        traffic:[
            { id:'cp-311', name:'CP 311 grain', dir:-1, s:9800, v:0, cruise:17, kind:'freight', cars:10, releaseAt: 90 },
            { id:'cp-90',  name:'CP 90 hotshot', dir:-1, s:13000, v:0, cruise:26, kind:'express', cars:6, releaseAt: 430 },
        ],
        meets:[
            { trainId:'cp-311', siding:'Tannery Flats loop' },
            { trainId:'cp-90',  siding:'Marrow Bend loop' },
        ],
        hazards:[ { type:'crossing', s:1100 }, { type:'crossing', s:5200 }, { type:'crossing', s:8900 } ],
        radio:[
            { atS: 300,   who:'radio', text:'9X, Halloway. Two meets for you today. 311 at Tannery, then 90 at Marrow Bend. Both are tight.' },
            { atS: 1900,  who:'dell',  text:'Seven hundred tons going downhill. Everything you do, do it early.' },
            { atS: 6400,  who:'radio', text:'9X, 311 is clear. Run to Marrow Bend and be in that loop by the time 90 is on you.' },
            { atS: 9600,  who:'dell',  text:'*Very quietly.* Hal is standing on the platform at Halloway. He drove out to watch.' },
        ],
        objectives:[
            { id:'arrive', text:'Deliver the whole train to Halloway' },
            { id:'ontime', text:'Hit the slot' },
            { id:'meet',   text:'Make both meets cleanly' },
            { id:'limits', text:'Observe every speed restriction' },
            { id:'shock',  text:'Protect the cryo flat' },
        ],
        pay: 16000,
    },

    closing: [
        { who:'hal', lines:[
            'Eleven cars a day, you said.',
            '*He is looking at the train, all the way down to the caboose.*',
            'I am going to write that the interchange at Halloway serves a common carrier of demonstrated reliability, and I am going to append the tape.',
            'And then I am going to go home, because I have been at this junction since four and so, I believe, have you.',
        ]},
    ],
},

/* ══ 10 ═══════════════════════════════════════════════════════════════════ */
{
    id: 'diesel-heart',
    title: 'Diesel Heart',
    subtitle: 'Marrow Bend — 03:20',
    epigraph: 'Dhuk. Dhuk. Dhuk. Six hundred and eighty litres of displacement at idle, ' +
              'shaking the floor of a shed in a valley nobody drives to.',

    opening: [
        { who:'meera', lines:[
            'Dell had a cardiac event at eleven o\'clock last night.',
            'He is stable. He is in Coldspring clinic, and Ivy says he needs to be in a cardiac unit at Halloway by six or she is not going to be able to promise anything.',
            'The helicopter is grounded. The road is the road.',
        ]},
        { who:'ivy', lines:[
            'I need him moved smoothly. Not fast — smoothly. Every jolt is a risk I cannot quantify and do not want to.',
            'Bring the medical van. I will ride with him.',
        ]},
        { who:'meera', lines:[
            'Seventeen has a cracked head on cylinder four. I found it at midnight.',
            'I can run her. She will make maybe seventy percent and she will run hot the whole way and I do not know — genuinely, I do not know — whether she finishes.',
            '*She is not crying. She is furious, which is what she does instead.*',
            'Forty-one years he drove that engine.',
        ]},
        { who:'you', choices:[
            { text:'"Then she gets him. Start her up."',
              reply:{ who:'meera', lines:[
                  '*She hits the start. The valley hears it — three in the morning and every light in Marrow Bend comes on.*',
                  'Dhuk. Dhuk. Dhuk.',
                  'All right, you old cow. One more.',
              ]}, effect:{ rep:3 } },
            { text:'"Get Pip. She is slow but she will not fail."',
              reply:{ who:'meera', lines:[
                  'Pip does forty-five and cannot hold the downgrade with a load. That is twenty minutes we do not have.',
                  '*Then:* But she will get there. It is the safer call and I will not argue with you for making it.',
              ]}, effect:{ flag:'took-pip' } },
        ]},
        { who:'narrator', lines:[
            '*Tomas is standing at the fence in the dark, in the coat that still does not fit him.*',
            '*He does not ask to come. He opens the gate, and he holds it, and he stands back.*',
        ]},
    ],

    run: {
        title: 'Coldspring → Halloway Junction',
        orders: 'Odell Bray to the cardiac unit at Halloway. Smoothly. ' +
                'Number seventeen has a cracked head and will make about seventy percent power, ' +
                'and she will run hot the entire way.',
        from:'coldspring', to:'halloway', loco:'wdm2',
        cars:['medical','combine'],
        hour: 3.6, weather:'clear', adhesion:'dry', ambient: 26,
        night: true,
        schedule: 1350, hardLimit: 1700,
        shockLimit: 0.55,
        cracked: { powerScale: 0.7, heatBias: 22 },
        traffic:[
            { id:'cp-14', name:'CP 14 tank train', dir:-1, s:8600, v:0, cruise:16, kind:'freight', cars:11, releaseAt: 60 },
        ],
        meets:[ { trainId:'cp-14', siding:'Wilder siding' } ],
        hazards:[ { type:'crossing', s:1100 }, { type:'crossing', s:5200 }, { type:'crossing', s:8900 } ],
        radio:[
            { atS: 60,    who:'radio',   text:'Sable Valley 9X — Halloway. Every signal on this railroad is green for you. Every one. Run.' },
            { atS: 2200,  who:'meera',   text:'Water temperature ninety-one and climbing. Do not chase the speed. She will give you what she has.' },
            { atS: 5200,  who:'ivy',     text:'He is awake. He says — *she stops* — he says you are braking too early. He says that is the correct fault to have.' },
            { atS: 8200,  who:'radio',   text:'9X, CP 14 has been put into Wilder for you. He is a tank train and he does not move for anybody, and he moved.' },
            { atS: 11200, who:'meera',   text:'Two miles. She is hot, she is down to five cylinders, and she is still pulling. *Quietly.* Come on. Come on, my girl.' },
        ],
        objectives:[
            { id:'arrive', text:'Reach Halloway Junction' },
            { id:'shock',  text:'Keep it smooth — no shock above 0.55g' },
            { id:'ontime', text:'Before six o\'clock' },
        ],
        pay: 0,
    },

    closing: [
        { who:'ivy', lines:[
            'They took him straight through. He was talking the whole way and I have never wanted anyone to shut up so badly in my life.',
        ]},
        { who:'meera', lines:[
            '*The engine is ticking as it cools. Steam is coming off the hood in the dark.*',
            'Cylinder four is finished. Head is cracked right through the water jacket and I think she was running on five for the last three miles.',
            'She knew. I am aware that is not a thing engines do. She knew.',
        ]},
        { who:'narrator', lines:[
            '*Sunrise at Halloway Junction. The valley behind you, twelve miles of it, climbing.*',
            '*Somewhere up there a mill is opening, a clinic is unlocking its doors, and a boy is walking down to a fence.*',
            '*The engine idles. Dhuk. Dhuk. Dhuk.*',
            '*The load needs pulling.*',
        ]},
    ],

    finale: true,
},
];

export function chapterById(id) { return CHAPTERS.find(c => c.id === id); }
