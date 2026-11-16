// js/views/PartyView.js

export class PartyView {

    constructor(container, game) {

        this.container = container;
        this.game = game;

    }

    render() {

        const allies =
            this.game.party.recruited;

        this.container.innerHTML = `

            <div class="party-screen">

                <div class="party-header">

                    <img
                        src="img/icon-original.png"
                        alt="Kaldur-Ath"
                        class="party-logo"
                    >

                    <h1>
                        COMPAÑÍA DE AVENTURA
                    </h1>

                </div>

                <div
                    class="party-grid"
                    id="partyGrid"
                >
                </div>

                <div class="party-footer">

                    <button
                        id="closePartyBtn"
                        class="party-close-btn"
                    >
                        Volver
                    </button>

                </div>

            </div>

        `;

        const grid =
            document.getElementById(
                'partyGrid'
            );

        allies.forEach(ally => {

            const card =
                document.createElement('div');

            const active =
                this.game.party.hasActive(
                    ally.id
                );

            card.className =
                'party-character-card';

            card.innerHTML = `

                <img
                    src="${ally.card}"
                    alt="${ally.name}"
                >

                <h3>${ally.name}</h3>

                <p>${ally.role ?? ''}</p>

                <span
                    class="
                    ${
                        active
                            ? 'party-active'
                            : 'party-reserve'
                    }
                    "
                >
                    ${
                        active
                            ? '⚔️ Activo'
                            : '🏕️ Reserva'
                    }
                </span>

            `;

            card.addEventListener(
                'click',
                () => {

                    this.game.showPartyCharacter(
                        ally.id
                    );

                }
            );

            grid.appendChild(card);

        });

        document
            .getElementById(
                'closePartyBtn'
            )
            .addEventListener(
                'click',
                () => {

                    this.game.loadNextEvent();

                }
            );

    }

}