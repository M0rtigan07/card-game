// js/stories/StoryManager.js

import { STORY_DATABASE } from './StoryDatabase.js';

export class StoryManager {

    constructor(player) {

        this.player = player;

        if (!this.player.storyState) {
            this.player.storyState = {
                monjeTrust: 0,
                monjeNameKnown: false
            };
        }
    }

    /**
     * Obtiene todas las historias disponibles
     * para la clase actual.
     */
    getAvailableStories() {

        const classStories =
            STORY_DATABASE[this.player.className] || [];

        return [
            ...STORY_DATABASE.global,
            ...classStories
        ];
    }

    /**
     * Devuelve el siguiente encuentro narrativo
     * o null si no toca historia.
     */
    getStoryEncounter(level) {

        const stories =
            this.getAvailableStories();

        for (const story of stories) {

            const currentChapter = this.getCurrentChapter(story);

            if (!currentChapter) {
                continue;
            }

            // Historia completada o ignorada
            if (currentChapter === -1) {
                continue;
            }

            const chapter =
                story.chapters.find(
                    c => c.id === currentChapter
                );

            if (!chapter) {
                continue;
            }

            if (level < chapter.minLevel) {
                continue;
            }

            // Probabilidad opcional
            if (
                chapter.chance !== undefined &&
                Math.random() > chapter.chance
            ) {
                continue;
            }

            return {

                storyId: story.id,

                storyTitle:
                    story.title,

                chapterId:
                    chapter.id,

                img:
                    chapter.img,

                description:
                    chapter.description,

                choices:
                    chapter.choices
            };
        }

        return null;
    }

    // gestionar nombre  de personajes

    getMonkName() {

        if (
            this.player.storyState
                ?.monjeNameKnown
        ) {
            return "Fray Aldren";
        }

        return "El Monje Loco";
    }
    
    

    /**
     * Devuelve el capítulo actual de una historia.
     */
    getCurrentChapter(story) {

        const value =
            this.player.storyState[story.id];

        if (value === undefined) {
            return 1;
        }

        return value;
    }

    /**
     * Avanza una historia.
     */
    setChapter(storyId, chapterId) {

        this.player.storyState[storyId] =
            chapterId;
    }

    /**
     * Marca una historia como finalizada.
     */
    completeStory(storyId) {

        this.player.storyState[storyId] = -1;
    }

    /**
     * Reinicia una historia.
     */
    resetStory(storyId) {

        delete this.player.storyState[storyId];
    }

    /**
     * Comprueba si una historia ya terminó.
     */
    isCompleted(storyId) {

        return (
            this.player.storyState[storyId] === -1
        );
    }

    /**
     * Devuelve el progreso actual.
     */
    getStoryProgress(storyId) {

        return this.player.storyState[storyId] || 1;
    }

}