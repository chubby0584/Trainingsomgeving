/* Vaste domeinkennis: beoordelingsmodel, posities, formaties en de start-oefenstof. */

App.seed = (function () {

  /* ---------------------------------------------------------------
     Beoordelingsmodel (TIPS) — vier pijlers met concrete criteria.
     Score 1-5:  1 = ver onder O17-niveau ... 5 = ruim boven O17-niveau
  --------------------------------------------------------------- */

  const TIPS = [
    {
      sleutel: 'techniek',
      label: 'Techniek',
      kleur: '#35d07f',
      criteria: [
        { sleutel: 'aannemen',  label: 'Aannemen & meenemen' },
        { sleutel: 'passing',   label: 'Passing kort/lang' },
        { sleutel: 'dribbel',   label: 'Dribbel & 1v1' },
        { sleutel: 'afwerken',  label: 'Afwerken' },
        { sleutel: 'kopspel',   label: 'Kopspel' },
        { sleutel: 'zwakbeen',  label: 'Zwakke been' }
      ]
    },
    {
      sleutel: 'inzicht',
      label: 'Inzicht',
      kleur: '#4aa3f0',
      criteria: [
        { sleutel: 'positie',    label: 'Positiespel balbezit' },
        { sleutel: 'restdek',    label: 'Positie balverlies / restverdediging' },
        { sleutel: 'keuzes',     label: 'Keuzes onder druk' },
        { sleutel: 'scannen',    label: 'Scannen / vooruit kijken' },
        { sleutel: 'omschakel',  label: 'Omschakelmomenten' },
        { sleutel: 'communicatie', label: 'Coaching op het veld' }
      ]
    },
    {
      sleutel: 'persoonlijkheid',
      label: 'Persoonlijkheid',
      kleur: '#f0b429',
      criteria: [
        { sleutel: 'mentaliteit', label: 'Trainingsmentaliteit' },
        { sleutel: 'coachbaar',   label: 'Coachbaarheid' },
        { sleutel: 'tegenslag',   label: 'Omgaan met tegenslag' },
        { sleutel: 'leiderschap', label: 'Leiderschap' },
        { sleutel: 'discipline',  label: 'Afspraken & discipline' },
        { sleutel: 'zelfstandig', label: 'Zelfstandigheid' }
      ]
    },
    {
      sleutel: 'snelheid',
      label: 'Snelheid',
      kleur: '#a78bfa',
      criteria: [
        { sleutel: 'sprint',     label: 'Sprintsnelheid' },
        { sleutel: 'acceleratie', label: 'Acceleratie eerste 5m' },
        { sleutel: 'wendbaar',   label: 'Wendbaarheid' },
        { sleutel: 'handeling',  label: 'Handelingssnelheid' },
        { sleutel: 'duel',       label: 'Duelkracht' },
        { sleutel: 'uithoud',    label: 'Uithoudingsvermogen' }
      ]
    }
  ];

  const SCORE_LABELS = {
    1: 'Ver onder niveau',
    2: 'Onder niveau',
    3: 'Op niveau O17',
    4: 'Boven niveau',
    5: 'Ruim boven niveau'
  };

  /* --- Posities --- */

  const POSITIES = [
    'Keeper', 'Rechtsback', 'Linksback', 'Centrale verdediger', 'Wingback',
    'Controlerende middenvelder', 'Centrale middenvelder', 'Aanvallende middenvelder',
    'Rechtsbuiten', 'Linksbuiten', 'Spits'
  ];

  const STATUSSEN = [
    { waarde: 'fit',        label: 'Fit',            badge: 'groen' },
    { waarde: 'licht',      label: 'Licht geblesseerd', badge: 'geel' },
    { waarde: 'blessure',   label: 'Geblesseerd',    badge: 'rood' },
    { waarde: 'revalidatie', label: 'Revalidatie',   badge: 'geel' },
    { waarde: 'afwezig',    label: 'Langdurig afwezig', badge: 'rood' }
  ];

  /* ---------------------------------------------------------------
     Formaties — coördinaten op een verticaal veld (viewBox 100 x 150),
     eigen doel onderaan (y = 150).
  --------------------------------------------------------------- */

  const FORMATIES = {
    '1-4-3-3': [
      { code: 'K',  naam: 'Keeper',   x: 50, y: 136 },
      { code: 'RB', naam: 'Rechtsback', x: 84, y: 108 },
      { code: 'CV', naam: 'Centraal',  x: 63, y: 114 },
      { code: 'CV', naam: 'Centraal',  x: 37, y: 114 },
      { code: 'LB', naam: 'Linksback', x: 16, y: 108 },
      { code: 'CM', naam: 'Controleur', x: 50, y: 88 },
      { code: 'MC', naam: 'Midden R',  x: 70, y: 70 },
      { code: 'MC', naam: 'Midden L',  x: 30, y: 70 },
      { code: 'RB2', naam: 'Rechtsbuiten', x: 84, y: 42 },
      { code: 'SP', naam: 'Spits',     x: 50, y: 32 },
      { code: 'LB2', naam: 'Linksbuiten', x: 16, y: 42 }
    ],
    '1-4-2-3-1': [
      { code: 'K',  naam: 'Keeper',   x: 50, y: 136 },
      { code: 'RB', naam: 'Rechtsback', x: 84, y: 108 },
      { code: 'CV', naam: 'Centraal',  x: 63, y: 114 },
      { code: 'CV', naam: 'Centraal',  x: 37, y: 114 },
      { code: 'LB', naam: 'Linksback', x: 16, y: 108 },
      { code: 'CM', naam: 'Controleur R', x: 62, y: 86 },
      { code: 'CM', naam: 'Controleur L', x: 38, y: 86 },
      { code: 'RM', naam: 'Rechtsbuiten', x: 82, y: 58 },
      { code: 'AM', naam: 'Nummer 10', x: 50, y: 58 },
      { code: 'LM', naam: 'Linksbuiten', x: 18, y: 58 },
      { code: 'SP', naam: 'Spits',     x: 50, y: 30 }
    ],
    '1-4-4-2': [
      { code: 'K',  naam: 'Keeper',   x: 50, y: 136 },
      { code: 'RB', naam: 'Rechtsback', x: 84, y: 108 },
      { code: 'CV', naam: 'Centraal',  x: 63, y: 114 },
      { code: 'CV', naam: 'Centraal',  x: 37, y: 114 },
      { code: 'LB', naam: 'Linksback', x: 16, y: 108 },
      { code: 'RM', naam: 'Rechtshalf', x: 84, y: 74 },
      { code: 'CM', naam: 'Midden R',  x: 62, y: 78 },
      { code: 'CM', naam: 'Midden L',  x: 38, y: 78 },
      { code: 'LM', naam: 'Linkshalf', x: 16, y: 74 },
      { code: 'SP', naam: 'Spits R',   x: 60, y: 34 },
      { code: 'SP', naam: 'Spits L',   x: 40, y: 34 }
    ],
    '1-3-5-2': [
      { code: 'K',  naam: 'Keeper',   x: 50, y: 136 },
      { code: 'CV', naam: 'Rechts in de 3', x: 70, y: 112 },
      { code: 'CV', naam: 'Centraal',  x: 50, y: 116 },
      { code: 'CV', naam: 'Links in de 3', x: 30, y: 112 },
      { code: 'WB', naam: 'Wingback R', x: 88, y: 82 },
      { code: 'CM', naam: 'Controleur', x: 50, y: 90 },
      { code: 'CM', naam: 'Midden R',  x: 66, y: 70 },
      { code: 'CM', naam: 'Midden L',  x: 34, y: 70 },
      { code: 'WB', naam: 'Wingback L', x: 12, y: 82 },
      { code: 'SP', naam: 'Spits R',   x: 60, y: 34 },
      { code: 'SP', naam: 'Spits L',   x: 40, y: 34 }
    ],
    '1-4-3-3 (dubbel 6)': [
      { code: 'K',  naam: 'Keeper',   x: 50, y: 136 },
      { code: 'RB', naam: 'Rechtsback', x: 84, y: 108 },
      { code: 'CV', naam: 'Centraal',  x: 63, y: 114 },
      { code: 'CV', naam: 'Centraal',  x: 37, y: 114 },
      { code: 'LB', naam: 'Linksback', x: 16, y: 108 },
      { code: 'CM', naam: 'Controleur R', x: 62, y: 84 },
      { code: 'CM', naam: 'Controleur L', x: 38, y: 84 },
      { code: 'AM', naam: 'Nummer 10', x: 50, y: 60 },
      { code: 'RB2', naam: 'Rechtsbuiten', x: 84, y: 44 },
      { code: 'SP', naam: 'Spits',     x: 50, y: 30 },
      { code: 'LB2', naam: 'Linksbuiten', x: 16, y: 44 }
    ]
  };

  /* --- Trainingsthema's en blokfases --- */

  const THEMAS = [
    'Opbouwen van achteruit', 'Positiespel / balbezit', 'Omschakeling na balverovering',
    'Omschakeling na balverlies', 'Druk zetten / pressing', 'Verdedigen compact blok',
    'Aanvallen over de flanken', 'Aanvallen door het centrum', 'Afwerken & scoren',
    'Duelkracht 1v1', 'Standaardsituaties', 'Fysiek / conditie', 'Wedstrijdvoorbereiding',
    'Herstel'
  ];

  const FASES = [
    { waarde: 'warming', label: 'Warming-up',  klasse: 'warming', kleur: '#f0b429' },
    { waarde: 'hoofd',   label: 'Hoofddeel',   klasse: 'hoofd',   kleur: '#35d07f' },
    { waarde: 'slot',    label: 'Slotdeel',    klasse: 'slot',    kleur: '#a78bfa' }
  ];

  const CATEGORIEEN = [
    'Warming-up', 'Passing & positiespel', 'Balbezit', 'Omschakeling',
    'Verdedigen', 'Aanvallen & afwerken', 'Partijvormen', 'Standaardsituaties',
    'Fysiek', 'Keeperstraining'
  ];

  /* ---------------------------------------------------------------
     Oefenstof — startbibliotheek, afgestemd op O17.
  --------------------------------------------------------------- */

  const OEFENINGEN = [
    {
      naam: 'Pass- en trapvormen in ruit',
      categorie: 'Warming-up',
      thema: ['Positiespel / balbezit'],
      duur: 12, spelers: '8-16', veld: '20x20m per groep',
      organisatie: 'Vier pionnen in een ruit, één speler per pion. Bal rondspelen volgens vast patroon (rechtsom), daarna wisselen van richting. Uitbreiden met dubbele pass en met kaatsen.',
      coachpunten: ['Aannemen met de verste voet, half open staan', 'Bal in de loop spelen, niet in de voeten', 'Vooraf kijken: waar ga ik heen na mijn pass', 'Tempo omhoog zodra het patroon zit'],
      variaties: ['Met twee ballen tegelijk', 'Pass + druk zetten op ontvanger', 'Verplicht één-tweetje bij de spits van de ruit']
    },
    {
      naam: 'Rondo 5v2 met twee neutrale spelers',
      categorie: 'Warming-up',
      thema: ['Positiespel / balbezit'],
      duur: 12, spelers: '7-9', veld: '12x12m',
      organisatie: 'Vijf spelers in een vierkant, twee in de rondo. Maximaal twee balcontacten. Balverlies = ruilen met de speler die de fout maakte. Punt voor de verdedigers na balverovering, punt voor balbezitters na een pass door de rondo heen.',
      coachpunten: ['Hoek maken vóórdat de bal komt', 'Snelheid van handelen belangrijker dan snelheid van de bal', 'Verdedigers samen laten jagen, niet los', 'Durf de lijn te breken'],
      variaties: ['Eén balcontact', 'Vrij bewegen op de lijnen', '5v3 om de druk te verhogen']
    },
    {
      naam: 'Positiespel 6v4 + 2 op klein veld',
      categorie: 'Passing & positiespel',
      thema: ['Positiespel / balbezit', 'Druk zetten / pressing'],
      duur: 20, spelers: '12-14', veld: '30x25m',
      organisatie: 'Zes balbezitters plus twee neutralen tegen vier verdedigers. Balbezitters scoren door acht keer over te spelen of door de bal in de vrije zone achter de verdediging te leggen. Verdedigers scoren door te veroveren en uit te breken op een klein doeltje.',
      coachpunten: ['Veld groot maken in balbezit, breedte en diepte', 'De derde man zoeken', 'Verdedigers: druk op de bal én pass-schaduw', 'Direct omschakelen bij balverlies (5 seconden jagen)'],
      variaties: ['Maximaal twee balcontacten voor balbezitters', 'Verdedigers krijgen 20 seconden om te veroveren', 'Neutralen alleen in de buitenzones']
    },
    {
      naam: 'Opbouwen van achteruit 7v5 tegen pressing',
      categorie: 'Passing & positiespel',
      thema: ['Opbouwen van achteruit'],
      duur: 25, spelers: '14-16', veld: 'Halve veldbreedte tot middenlijn',
      organisatie: 'Keeper + 4 verdedigers + 2 controleurs tegen 5 aanvallers die druk zetten. Opbouwende partij scoort door de bal beheerst over de middenlijn te dribbelen of in te spelen op een aanspeelpunt. Pressende partij scoort op twee kleine doeltjes.',
      coachpunten: ['Keeper actief betrekken als extra speler', 'Backs breed en hoog, centrale verdedigers uit elkaar', 'Controleur zoekt de rug van de spits', 'Bal vasthouden tot de tegenstander stappen zet, dán passeren'],
      variaties: ['Pressende partij mag pas druk zetten na de eerste pass', 'Lange bal telt alleen als een tweede bal wordt gewonnen', 'Tijdslimiet van 12 seconden om de middenlijn te halen']
    },
    {
      naam: 'Doorschuifvorm 4v4+3 met zonewissel',
      categorie: 'Balbezit',
      thema: ['Positiespel / balbezit', 'Omschakeling na balverovering'],
      duur: 20, spelers: '11-14', veld: '40x30m in drie zones',
      organisatie: 'Veld in drie zones. Balbezittende partij speelt met overtal in de zone waar de bal is; verdedigers mogen met een vast aantal spelers doorschuiven. Doel: de bal beheerst van de ene buitenzone naar de andere spelen.',
      coachpunten: ['Zoek de vrije man in de volgende zone', 'Kantelen: bal snel van kant wisselen', 'Verdedigers: schuif tegelijk door, niet één voor één'],
      variaties: ['Punten verdubbelen bij zonewissel binnen 5 seconden', 'Verdedigers mogen één speler vooruit jagen']
    },
    {
      naam: 'Omschakeling 4v4 met vier doelen',
      categorie: 'Omschakeling',
      thema: ['Omschakeling na balverovering', 'Omschakeling na balverlies'],
      duur: 18, spelers: '8-12', veld: '30x25m, vier kleine doeltjes',
      organisatie: 'Vier tegen vier op een veld met twee kleine doeltjes per kant. Na balverovering zo snel mogelijk scoren op het verst gelegen open doel. Wisselen elke 3 minuten.',
      coachpunten: ['Eerste actie na balverovering is vooruit', 'Direct de diepte zoeken vóór de tegenstander georganiseerd is', 'Bij balverlies: dichtstbijzijnde speler zet druk, rest zakt centraal in'],
      variaties: ['Scoren binnen 6 seconden na verovering telt dubbel', 'Extra neutrale speler voor de balbezittende partij']
    },
    {
      naam: 'Counter-vorm 3v2 naar 4v3',
      categorie: 'Omschakeling',
      thema: ['Omschakeling na balverovering', 'Aanvallen door het centrum'],
      duur: 18, spelers: '12-16', veld: 'Half veld met groot doel + keeper',
      organisatie: 'Drie aanvallers starten vanaf de middenlijn tegen twee verdedigers. Na 5 seconden sluit een derde verdediger aan, tegelijk komt een vierde aanvaller in. Afronden binnen 10 seconden.',
      coachpunten: ['Bal vooruit met de eerste aanraking', 'Buitenspelers breed houden om ruimte centraal te maken', 'Beslissing nemen vóór de extra verdediger arriveert', 'Verdedigers: vertragen en naar binnen dwingen'],
      variaties: ['Start met een lange bal van de keeper', 'Verdedigers krijgen een uitbreekdoel voor de omschakeling terug']
    },
    {
      naam: 'Verdedigen in een compact blok 8v8',
      categorie: 'Verdedigen',
      thema: ['Verdedigen compact blok', 'Druk zetten / pressing'],
      duur: 25, spelers: '16-18', veld: 'Twee derde veld met groot doel',
      organisatie: 'Verdedigende partij in het gekozen blok (middenveldpressing). Aanvallende partij bouwt op vanaf de eigen helft. Verdedigers scoren door te veroveren en de bal over de middenlijn te spelen.',
      coachpunten: ['Afstanden tussen de linies maximaal 10 meter', 'Pressingmoment afspreken: terugspeelbal of pass naar de zijkant', 'Kantelen als de bal naar de flank gaat', 'Spits stuurt de opbouw naar één kant'],
      variaties: ['Hoge pressing in plaats van middenveldpressing', 'Aanvallers krijgen een extra speler', 'Verdedigers puntenaftrek bij overtreding']
    },
    {
      naam: '1v1 verdedigen op de flank',
      categorie: 'Verdedigen',
      thema: ['Duelkracht 1v1'],
      duur: 15, spelers: '8-16', veld: '20x14m langs de zijlijn',
      organisatie: 'Aanvaller start met bal en probeert de achterlijn te bereiken of naar binnen te kappen en te scoren op een klein doel. Verdediger dwingt naar buiten. Rollen wisselen na elke beurt.',
      coachpunten: ['Snel eerste 3 meter, dan afremmen', 'Zijwaartse houding, buitenvoet voor', 'Niet duiken; wachten op de eerste aanraking van de aanvaller', 'Lichaamscontact zoeken zodra de aanvaller passeert'],
      variaties: ['Verdediger start met achterstand van 2 meter', 'Aanvaller mag terugspelen op een steunspeler']
    },
    {
      naam: 'Afwerken na voorzet — dubbele bezetting',
      categorie: 'Aanvallen & afwerken',
      thema: ['Aanvallen over de flanken', 'Afwerken & scoren'],
      duur: 20, spelers: '10-18', veld: 'Half veld, groot doel + keeper',
      organisatie: 'Vanaf beide flanken afwisselend een voorzet. Drie spelers lopen in: eerste paal, tweede paal, terugleggen op de rand 16. Twee passieve verdedigers erbij zodra het loopt.',
      coachpunten: ['Timing: pas starten als de voorzetgever het hoofd opheft', 'Eerste paal kort en hard, tweede paal met boog', 'Loopactie afmaken, ook zonder bal', 'Aanname vermijden in de zestien: direct afronden'],
      variaties: ['Voorzet vanaf de achterlijn versus vanaf de zijkant 16', 'Verdedigers actief maken', 'Punten voor eerste paal-doelpunten verdubbelen']
    },
    {
      naam: 'Afwerkcircuit onder tijdsdruk',
      categorie: 'Aanvallen & afwerken',
      thema: ['Afwerken & scoren'],
      duur: 15, spelers: '8-16', veld: 'Half veld, twee doelen + keepers',
      organisatie: 'Drie stations: kaatsen en afronden buiten de zestien, diepteloop met steekbal, draaien op de spits en afronden. Elke speler roteert; elk station 4 minuten met wedstrijdtempo.',
      coachpunten: ['Kijk naar de keeper vóór het schot', 'Vaste standbeenplaatsing naast de bal', 'Bal laag houden bij schoten van buiten de zestien', 'Rebound altijd afmaken'],
      variaties: ['Wedstrijdje tussen twee groepen', 'Afronden verplicht binnen twee contacten']
    },
    {
      naam: 'Partij 8v8 met opbouwzones',
      categorie: 'Partijvormen',
      thema: ['Opbouwen van achteruit', 'Positiespel / balbezit'],
      duur: 25, spelers: '16-18', veld: 'Twee derde veld, twee grote doelen',
      organisatie: 'Normale partij, maar een doelpunt telt dubbel als de aanval via een beheerste opbouw vanaf de keeper is opgezet (minimaal vijf passes vóór de middenlijn).',
      coachpunten: ['Geduld in de opbouw, tempo bij het passeren van de linie', 'Aanspeelpunten permanent aanbieden', 'Spelhervattingen ook als opbouwmoment gebruiken'],
      variaties: ['Verboden lange bal', 'Vrije man op de middenlijn voor beide teams']
    },
    {
      naam: 'Wedstrijdvorm 11v11 op wedstrijdformatie',
      categorie: 'Partijvormen',
      thema: ['Wedstrijdvoorbereiding'],
      duur: 30, spelers: '18-22', veld: 'Heel veld',
      organisatie: 'Basiself tegen de rest, in de formatie van komende zaterdag. Spelmomenten stilleggen om de afspraken van het wedstrijdplan te herhalen. Laatste 10 minuten vrij doorspelen.',
      coachpunten: ['Afspraken benoemen vóór het stilleggen, niet erna', 'Maximaal drie stops per fase, anders verdwijnt het spelritme', 'Positieve bevestiging als de afspraak wél goed gaat'],
      variaties: ['Tegenpartij speelt in het systeem van de tegenstander', 'Score-opdracht per linie']
    },
    {
      naam: 'Corners aanvallend — twee varianten',
      categorie: 'Standaardsituaties',
      thema: ['Standaardsituaties'],
      duur: 12, spelers: '11-18', veld: 'Zestien met doel + keeper',
      organisatie: 'Variant A: blokje bij de eerste paal, drie inlopers vanuit de rand zestien. Variant B: korte corner met overtal en voorzet vanaf de rand zestien. Beide varianten tien keer uitvoeren, daarna met tegenstand.',
      coachpunten: ['Vaste startposities en een duidelijk startsein', 'Loopacties kruisen om markering te breken', 'Eén speler altijd op de rand zestien voor de tweede bal', 'Restverdediging tegen de counter benoemen'],
      variaties: ['Signaal via handteken van de nemer', 'Variant met bal naar de tweede paal']
    },
    {
      naam: 'Verdedigen van standaardsituaties',
      categorie: 'Standaardsituaties',
      thema: ['Standaardsituaties', 'Verdedigen compact blok'],
      duur: 12, spelers: '11-18', veld: 'Zestien met doel + keeper',
      organisatie: 'Vaste taakverdeling bij corners tegen: twee man zonedekking op de palen, mandekking op de sterkste koppers, één speler op de korte corner, één aanspeelpunt vooruit. Herhalen tot de posities zonder aanwijzing worden ingenomen.',
      coachpunten: ['Keeper commandeert de zestien', 'Uitverdedigen naar de zijkant, nooit centraal', 'Direct doorschuiven na de uittrap', 'De speler vooruit blijft altijd staan voor de counter'],
      variaties: ['Vrije trappen vanaf de zijkant', 'Aanvallers krijgen een tweede-bal-opdracht']
    },
    {
      naam: 'Intervaltraining met bal (4x4 minuten)',
      categorie: 'Fysiek',
      thema: ['Fysiek / conditie'],
      duur: 25, spelers: '10-20', veld: '40x30m',
      organisatie: 'Vier blokken van vier minuten partijspel in klein veld met hoge intensiteit, drie minuten actief herstel ertussen (rustig inspelen of mobiliteit). Kleine teams houden de intensiteit hoog.',
      coachpunten: ['Intensiteit boven techniek in deze vorm', 'Herstel echt actief houden, niet stilstaan', 'Bij hitte of volle wedstrijdweek: één blok minder'],
      variaties: ['4v4 met doeltjes', '3v3 met neutrale speler', 'Blokken van 3 minuten bij hogere intensiteit']
    },
    {
      naam: 'Sprint- en acceleratievorm met beslissing',
      categorie: 'Fysiek',
      thema: ['Fysiek / conditie', 'Duelkracht 1v1'],
      duur: 15, spelers: '8-20', veld: '25x20m',
      organisatie: 'Twee spelers starten naast elkaar op een visueel signaal (bal die de trainer laat vallen naar links of rechts). Sprint van 10-15 meter naar de bal, winnaar mag afronden op klein doel. Volledig herstel tussen de herhalingen (1:6).',
      coachpunten: ['Maximaal maken; kwaliteit boven aantal herhalingen', 'Volledige rust, anders wordt het conditie in plaats van snelheid', 'Eerste drie passen laag en explosief', 'Maximaal 8-10 herhalingen per speler'],
      variaties: ['Start liggend of met de rug naar de bal', 'Sprint met richtingsverandering rond een pion']
    },
    {
      naam: 'Core- en blessurepreventie (FIFA 11+ deel 2)',
      categorie: 'Fysiek',
      thema: ['Fysiek / conditie', 'Herstel'],
      duur: 12, spelers: 'hele groep', veld: 'Zijkant veld',
      organisatie: 'Plank voorwaarts en zijwaarts, hamstringoefening in tweetallen (Nordic), eenbenige balans, squats en sprongen met gecontroleerde landing. Twee tot drie series, opbouwend in de eerste weken van het seizoen.',
      coachpunten: ['Techniek boven aantal herhalingen', 'Landing: knie boven de voet, niet naar binnen', 'Twee keer per week volstaat voor het preventie-effect', 'Kniebuiging bij Nordic langzaam laten zakken'],
      variaties: ['Progressie in moeilijkheidsgraad per blok van 4 weken', 'Individueel programma voor spelers met groeispurt']
    },
    {
      naam: 'Keeper: uittrap en meevoetballen',
      categorie: 'Keeperstraining',
      thema: ['Opbouwen van achteruit'],
      duur: 20, spelers: '1-3 keepers', veld: 'Zestien tot middenlijn',
      organisatie: 'Terugspeelballen verwerken onder oplopende druk: eerst vrij, dan met een jagende aanvaller. Uittrappen op doelen op verschillende afstanden. Afsluiten met opbouwmomenten samen met de verdedigers.',
      coachpunten: ['Startpositie hoog genoeg om aanspeelbaar te zijn', 'Eerste aanraking uit de druk weg', 'Kijken vóór de bal aankomt', 'Beslissing kort of lang bewust maken'],
      variaties: ['Uittrap met tweede bal-opdracht voor het veldteam', 'Onder tijdsdruk van 4 seconden']
    },
    {
      naam: 'Keeper: hoekbal- en voorzetbeheersing',
      categorie: 'Keeperstraining',
      thema: ['Standaardsituaties'],
      duur: 18, spelers: '1-3 keepers', veld: 'Zestien met doel',
      organisatie: 'Voorzetten vanaf beide flanken, wisselend hoog en strak. Eerst zonder tegenstand, daarna met twee aanvallers en twee verdedigers in de zestien. Afsluiten met corners.',
      coachpunten: ['Startpositie afhankelijk van de plek van de bal', 'Duidelijk commando: "los" of "keeper"', 'Vuisten als de bal in het gedrang komt', 'Herstelpositie na de eerste actie'],
      variaties: ['Voorzetten met verplicht uitverdedigen erna', 'Wisselend licht- en zichtbeperking (avondtraining)']
    },
    {
      naam: 'Herstelsessie na wedstrijd',
      categorie: 'Fysiek',
      thema: ['Herstel'],
      duur: 30, spelers: 'hele groep', veld: 'Half veld',
      organisatie: 'Voor spelers die 60+ minuten speelden: rustig inspelen, mobiliteit en rondo op laag tempo. Spelers die weinig speelden krijgen een intensief blok van 20 minuten partijspel.',
      coachpunten: ['Twee programma\'s, duidelijk gescheiden', 'Wisselspelers echt belasten, anders lopen zij belasting mis', 'Evaluatie van de wedstrijd kort en concreet houden'],
      variaties: ['Alleen mobiliteit bij een dubbele speelweek']
    },
    {
      naam: 'Individuele actie: passeerbewegingen',
      categorie: 'Aanvallen & afwerken',
      thema: ['Duelkracht 1v1'],
      duur: 15, spelers: '6-16', veld: '25x20m',
      organisatie: 'Per tweetal een pion als verdediger: passeerbeweging inslijpen (kap binnen, kap buiten, schaar, overstap). Daarna 1v1 tegen een echte verdediger met de opdracht dezelfde beweging te gebruiken.',
      coachpunten: ['Snelheidsverschil maken ná de beweging, niet ervoor', 'Bal dicht bij de voet tot het moment van versnellen', 'Elke speler kiest twee bewegingen als eigen wapen', 'Fouten maken is de bedoeling in deze vorm'],
      variaties: ['Passeren met verplicht zwakke been', 'Afronden na de passeeractie']
    },
    {
      naam: 'Tweede bal-vorm',
      categorie: 'Omschakeling',
      thema: ['Omschakeling na balverovering', 'Duelkracht 1v1'],
      duur: 15, spelers: '10-16', veld: '35x30m',
      organisatie: 'Trainer speelt een hoge bal in het midden. Twee teams van vier duelleren om de tweede bal en scoren daarna op een klein doel. Nieuwe bal elke 30 seconden.',
      coachpunten: ['Anticiperen waar de bal neerkomt, niet kijken naar het kopduel', 'Kopduel winnen is minder belangrijk dan de tweede bal pakken', 'Direct spelen na de verovering'],
      variaties: ['Bal vanaf de flank in plaats van centraal', 'Extra punt bij scoren binnen 8 seconden']
    },
    {
      naam: 'Speelwijze-walkthrough zonder tegenstand',
      categorie: 'Partijvormen',
      thema: ['Wedstrijdvoorbereiding'],
      duur: 15, spelers: '11-16', veld: 'Heel veld',
      organisatie: 'Elftal loopt in wandeltempo de afgesproken bewegingen door: opbouwpatroon, pressingmoment, restverdediging bij aanval. Trainer stuurt de bal, geen tegenstand.',
      coachpunten: ['Beelden geven in plaats van praten', 'Maximaal drie afspraken per sessie', 'Herhalen tot het zonder aanwijzing gaat'],
      variaties: ['Met passieve tegenstand als tweede stap', 'Alleen de linie die deze week centraal staat']
    }
  ];

  /* --- Startteam: lege selectie, de trainer vult zelf aan --- */

  function nieuweStaat() {
    return {
      versie: 1,
      team: {
        naam: 'O17-1',
        club: '',
        seizoen: seizoenLabel(),
        trainer: '',
        formatie: '1-4-3-3',
        speelwijze: '',
        trainingsdagen: 'dinsdag, donderdag',
        wedstrijddag: 'zaterdag'
      },
      spelers: [],
      oefeningen: OEFENINGEN.map((o, i) => Object.assign({ id: 'oef-basis-' + i, eigen: false }, o)),
      trainingen: [],
      wedstrijden: []
    };
  }

  function seizoenLabel() {
    const nu = new Date();
    const start = nu.getMonth() >= 6 ? nu.getFullYear() : nu.getFullYear() - 1;
    return start + '/' + (start + 1);
  }

  return {
    TIPS, SCORE_LABELS, POSITIES, STATUSSEN, FORMATIES,
    THEMAS, FASES, CATEGORIEEN, OEFENINGEN,
    nieuweStaat, seizoenLabel
  };
})();
