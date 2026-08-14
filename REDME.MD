ocean-simulator/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js                 # Entry point, loop principal
│   ├── camera-helper.js             
│   ├── clouds.js             
│   ├── config.js               # Constantes globais e estado
│   ├── state.js                # Estado compartilhado da simulação
│   ├── scene.js                # Scene, renderer, câmera, composer
│   ├── sky.js                  # Sol, lua, estrelas, ciclo dia/noite
│   ├── weather.js              # Tempestade, chuva, neblina, raios
│   ├── ocean/
│   │   ├── waves.js            # Sistema de ondas (shader + CPU)
│   │   ├── water-material.js   # Material da água (shader)
│   │   ├── foam.js             # Partículas de espuma
│   │   ├── spray.js            # Spray/respingos
│   │   └── wake.js             # Rastro do barco
│   ├── boats/
│   │   ├── boat-manager.js     # Gerencia barco ativo, troca
│   │   ├── boat-base.js        # Classe base de barco (interface)
│   │   ├── trawler.js          # Pesqueiro: build + física própria
│   │   └── pilot.js            # Piloto: build + física própria
│   ├── physics/
│   │   ├── buoyancy.js         # Flutuabilidade, pitch, roll
│   │   ├── hull-physics.js     # Física de casco por tipo
│   │   └── collisions.js       # Colisões (futuro: dano, batalha)
│   ├── controls/
│   │   ├── input-manager.js    # Abstração: teclado/mouse/gamepad
│   │   ├── keyboard.js         # Controles de teclado
│   │   ├── mouse.js            # Mouse + câmera orbital
│   │   └── gamepad.js          # Gamepad (preparado p/ futuro)
│   ├── audio/
│   │   ├── audio-manager.js    # Web Audio context + master
│   │   ├── engine-sound.js     # Som do motor (por barco)
│   │   ├── ambient.js          # Oceano, vento
│   │   └── effects.js          # Splash, buzina, trovão
│   ├── ui/
│   │   ├── hud.js              # Atualização do HUD
│   │   └── loading.js          # Tela de loading
│   ├── world/
│   │   ├── world-map.js        # Mapa fixo, regiões, ilhas
│   │   ├── underwater.js       # Fundo do mar, peixes, ambiente sub
│   │   └── objects.js          # Boias, navios distantes, etc.
│   └── game/
│       ├── game-manager.js     # Modos de jogo, state machine
│       └── damage.js           # Sistema de dano e destruição
└── assets/
    └── (texturas, modelos futuros)