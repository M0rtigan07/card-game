// js/views/StoryView.js
import { StoryResolver }
from '../stories/StoryResolver.js';


export class StoryView {

    constructor(exploration) {

        this.exploration = exploration;
    }

    show(story) {

        const view =
            this.exploration.render();

        this.exploration.setSceneImage(
            story.img
        );

        view.setNarrative(
            story.description,

            story.choices.map(choice => ({

                text: choice.text,

                callback: () =>
                    this.exploration.onStoryChoice(
                        choice,
                        story.storyId
                    )
            }))
        );
    }
}