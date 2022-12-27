exports.get = () => {
    const bean = __.newBean('systems.rcd.enonic.datatoolbox.RcdHomeScriptBean');

    return {
        contentType: 'application/json',
        body: bean.getInfo()
    }
};