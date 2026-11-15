// js/views/PartyView.js

export class PartyView {

    constructor(container, game) {

        this.container = container;
        this.game = game;

    }

    render() {

        const party = this.game.party;

        this.container.innerHTML = `

            <div class="party-view">

                <h2>👥 Grupo</h2>

                <div class="party-section">

                    <h3>
                        Activos
                        (${party.active.length})
                    </h3>

                    <div id="activeMembers"></div>

                </div>

                <div class="party-section">

                    <h3>
                        Reclutados
                        (${party.recruited.length})
                    </h3>

                    <div id="recruitedMembers"></div>

                </div>

            </div>

        `;

        this.renderActive();
        this.renderRecruited();

    }

    renderActive() {

        const container =
            document.getElementById(
                'activeMembers'
            );

        container.innerHTML = '';

        this.game.party.active.forEach(
            ally => {

                const card =
                    document.createElement('div');

                card.className =
                    'party-card';

                card.innerHTML = `

                    <strong>
                        ${ally.name}
                    </strong>

                    <button>
                        ➖ Quitar
                    </button>

                `;

                card
                    .querySelector('button')
                    .addEventListener(
                        'click',
                        () => {

                            this.game.party.deactivate(
                                ally.id
                            );

                            this.render();

                        }
                    );

                container.appendChild(card);

            }
        );

    }

    renderRecruited() {

        const container =
            document.getElementById(
                'recruitedMembers'
            );

        container.innerHTML = '';

        const activeIds =
            this.game.party.active.map(
                a => a.id
            );

        this.game.party.recruited

            .filter(
                ally =>
                    !activeIds.includes(
                        ally.id
                    )
            )

            .forEach(
                ally => {

                    const card =
                        document.createElement(
                            'div'
                        );

                    card.className =
                        'party-card';

                    card.innerHTML = `

                        <strong>
                            ${ally.name}
                        </strong>

                        <button>
                            ➕ Activar
                        </button>

                    `;

                    card
                        .querySelector(
                            'button'
                        )
                        .addEventListener(
                            'click',
                            () => {

                                const result =
                                    this.game.party.activate(
                                        ally.id
                                    );

                                if (!result.ok) {

                                    alert(
                                        result.reason
                                    );

                                }

                                this.render();

                            }
                        );

                    container.appendChild(
                        card
                    );

                }
            );

    }

}