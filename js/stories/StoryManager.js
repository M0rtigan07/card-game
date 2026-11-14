// js/stories/StoryManager.js

import { STORY_DATABASE } from './StoryDatabase.js';

export class StoryManager {

    constructor(player) {

        this.player = player;

        if (!this.player.storyState) {
            this.player.storyState = {
                monjeLocoChapter: 1,
                monjeLocoTrust: 0
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

        console.log(
            "[Estado historias]",
            this.player.storyState
        );

        const stories =
            this.getAvailableStories();

        for (const story of stories) {

            const currentChapter = this.getCurrentChapter(story);

            console.log(
                "[StoryManager]",
                "Planta:",
                level
            );



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

    getStoryById(storyId) {

        const stories =
            this.getAvailableStories();

        const story =
            stories.find(
                s => s.id === storyId
            );

        if (!story) {
            return null;
        }

        const currentChapter =
            this.getCurrentChapter(story);

        const chapter =
            story.chapters.find(
                c => c.id === currentChapter
            );

        if (!chapter) {
            return null;
        }

        return {

            storyId: story.id,

            storyTitle: story.title,

            chapterId: chapter.id,

            img: chapter.img,

            description:
                chapter.description,

            choices:
                chapter.choices

        };

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


// Avanza la historia  segun personaje

    checkStoryProgress(storyId) {

        const stories =
            this.getAvailableStories();

        const story =
            stories.find(
                s => s.id === storyId
            );

        if (!story?.progression) {
            return false;
        }

        const state = this.player.storyState;

        const currentChapter =
            state[`${storyId}Chapter`] || 1;

        const currentTrust =
            state[`${storyId}Trust`] || 0;

        const nextChapter =
            currentChapter + 1;

        const requirements =
            story.progression[nextChapter];

        if (!requirements) {
            return false;
        }

        if (
            requirements.trust &&
            currentTrust < requirements.trust
        ) {
            return false;
        }

        state[`${storyId}Chapter`] =
            nextChapter;

        return true;
    }

    /**
     * Devuelve el progreso actual.
     */
    getStoryProgress(storyId) {

        return this.player.storyState[storyId] || 1;
    }

}