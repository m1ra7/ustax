/** One SQL statement: a challenge can commit only alongside its matching record revision. */
export function decisionStatement(challengeId:string,recordId:string,revision:number,data:unknown){return {text:`WITH claimed AS (
 UPDATE verification_codes SET used=true
 WHERE id=$1 AND record_id=$2 AND used=false AND expires_at>now()
 AND EXISTS(SELECT 1 FROM service_records WHERE id=$2 AND revision=$3)
 RETURNING id
) UPDATE service_records SET data=$4::jsonb,revision=revision+1
 WHERE id=$2 AND revision=$3 AND EXISTS(SELECT 1 FROM claimed) RETURNING id`,params:[challengeId,recordId,revision,JSON.stringify(data)]};}
