(() => {
    // Get list of tags
    const tags = gql.Do(`{
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
    }`)

    const tagAliases = []
    tags['findTags']['tags'].forEach(tag => {
       tag['aliases'].concat(tag['name']).forEach(str => {
           tagAliases.push({
               id: tag['id'],
               name: tag['name'],
               value: str 
           })
        })
    })

    log.Info(`Extended Auto Tagger searching for ${tagAliases.length} tags including aliases`)

    tagAliases.forEach((tagAlias, index) => {
        // Search for string

        // Build regex for matching
        preRegex="(^|_|[^\p{L}\d])"
        joinRegex="[.\-_ ]*"
        postRegex="($|_|[^\p{L}\d])"
        matchingScenes = gql.Do(`
            query FindScenes($str: String!, $tagId: ID!) {
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
                            }, OR: {
                                path: {
                                    value: $str, modifier: MATCHES_REGEX
                                }
                            }
                        }
                    }
                }) {
                    scenes { id }
                }
            }`,
            { 
                "tagId": tagAlias.id,
                "str": preRegex + tagAlias.value.replaceAll(' ', joinRegex) + postRegex
            }
        )

        let tagToken = tagAlias.name
        if(tagAlias.name != tagAlias.value) {
            tagToken += ' via alias ' + tagAlias.value
        }

        // Update the progress
        log.Progress(index/tagAliases.length)

        // Return early if there are no scenes to tag.
        if(matchingScenes['findScenes']['scenes'].length == 0) {
            log.Debug(`No additional scenes found for ${tagToken}`)
            return
        }

        mutation = `mutation BulkSceneUpdate($sceneIds: [ID!], $tagId: ID!) {
            bulkSceneUpdate(input: {
                ids: $sceneIds,
                tag_ids: {
                    ids: [$tagId],
                    mode: ADD
                }
            }) { id }
        }`
        variables = {
            "tagId": tagAlias.id,
            "sceneIds": matchingScenes['findScenes']['scenes'].map(scene => scene['id'])
        }

        // Update matching scenes with tag id.
        results = gql.Do(mutation, variables)

        if(results['bulkSceneUpdate'].length > 0) {
            log.Info(`Added ${tagToken} to ${results['bulkSceneUpdate'].length} scenes.`)
        } else {
            log.Error('Expected to add tags, but none were added.')
        }
    })

    return {
        Output: "ok"
    };
})();
