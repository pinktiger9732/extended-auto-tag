const PRE_REGEX="(^|_|[^\p{L}\d])"
const JOIN_REGEX="[.\-_ ]*"
const POST_REGEX="($|_|[^\p{L}\d])"

const FIND_SCENES = `query FindScenes($str: String!, $tagId: ID!) {
                        findScenes(filter: {
                            per_page: -1
                        } scene_filter: {
                            tags: {
                                excludes: [$tagId], modifier: INCLUDES_ALL
                            }, AND: {
                                details: {
                                    value: $str, modifier: MATCHES_REGEX
                                }, OR: {
                                    title: {
                                        value: $str, modifier: MATCHES_REGEX
                                    }
                                }
                            }
                        }) {
                            scenes { id }
                        }
                    }`

const FIND_TAGS = `{
    findTags(tag_filter: {
        ignore_auto_tag: false
    }, filter: {
        per_page: -1
    }) {
        tags { 
            id 
            name 
            aliases 
        }
    }
}`

const BULK_SCENE_UPDATE = `mutation BulkSceneUpdate($sceneIds: [ID!], $tagId: ID!) {
                              bulkSceneUpdate(input: {
                                  ids: $sceneIds,
                                  tag_ids: {
                                      ids: [$tagId],
                                      mode: ADD
                                  }
                              }) { id }
                          }`

function tagToRegex(tag) {
    return '(?i)' + tag.aliases.map(alias => {
        return PRE_REGEX + alias.replaceAll(' ', JOIN_REGEX) + POST_REGEX
    }).join('|')
}

(() => {
    // Get list of tags
    const tags = gql.Do(FIND_TAGS)['findTags']['tags'].map(tag => {
        return {
            id: tag['id'],
            name: tag['name'],
            aliases: tag['aliases'].concat(tag['name'])
        }
    })

    log.Info(`Extended Auto Tagger searching for ${tags.length} tags.`)

    tags.forEach((tag, index) => {
        log.Progress(index/tags.length)

        const findScenesVariables = { 
            "tagId": tag.id,
            "str": tagToRegex(tag)
        }

        log.Trace('FIND_SCENES variables' + JSON.stringify(findScenesVariables))

        const matchingScenes = gql.Do(FIND_SCENES, findScenesVariables)

        if(matchingScenes['findScenes']['scenes'].length == 0) {
            log.Debug(`No additional scenes found for ${tag.name}`)
            return
        }

        results = gql.Do(BULK_SCENE_UPDATE, {
            "tagId": tag.id,
            "sceneIds": matchingScenes['findScenes']['scenes'].map(scene => scene['id'])
        })

        if(results['bulkSceneUpdate'].length > 0) {
            log.Info(`Added ${tag.name} to ${results['bulkSceneUpdate'].length} scenes.`)
        } else {
            log.Error('Expected to add tags, but none were added.')
        }
    })

    return {
        Output: "ok"
    };
})();
