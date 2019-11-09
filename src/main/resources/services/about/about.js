exports.get = () => {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdAboutScriptBean');

    return {
        contentType: 'application/json',
        body: bean.getAboutInfo()
    }
};