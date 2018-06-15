This project has to connect to a google spreadsheet published as a "living"
CSV.  This means the publishing option which says to republish on changes must
be checked, otherwise changes to the spreadsheet won't be reflected on the map.

The corazon.js file needs the published CSV URL around line 450.

The spreadsheet columns which are in use by the code are as follows:

- Years Start
- Years End
- To Label
- To Longitude
- From Label
- From Longitude
- Color
- Pos
- From Label
- To Label
- Bend

I don't know what they all mean.
